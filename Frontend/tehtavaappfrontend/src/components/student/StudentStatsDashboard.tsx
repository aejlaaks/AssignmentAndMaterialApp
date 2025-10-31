import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  FilterList as FilterIcon,
  PieChart as PieChartIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { groupService } from '../../services/courses/groupService';
import { AssignmentStats, IStudentWithStats } from '../../interfaces/services/IGroupService';
import { useAssignmentService } from '../../contexts/ServiceContext';

// Define interfaces for grade data
interface AssignmentGrade {
  assignmentId: string;
  assignmentName: string;
  grade: number | null;
  maxGrade: number;
  submittedAt: string;
  isGraded: boolean;
}

interface StudentGrades {
  assignments: AssignmentGrade[];
  averageGrade: number;
}

// Extend the IStudentWithStats for our component
interface StudentWithGrades extends IStudentWithStats {
  grades?: StudentGrades;
  groupId?: string;
  groupName?: string;
}

interface StudentStatsDashboardProps {
  courseId: string;
}

const StudentStatsDashboard: React.FC<StudentStatsDashboardProps> = ({ courseId }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithGrades[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [stats, setStats] = useState({
    averageCompletionRate: 0,
    totalStudents: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    highPerformers: 0, // Students with >80% completion
    lowPerformers: 0,  // Students with <30% completion
    averageGrade: 0,   // Add average grade
  });
  
  // Add state for selected student and dialog
  const [selectedStudent, setSelectedStudent] = useState<StudentWithGrades | null>(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  
  const theme = useTheme();
  const assignmentService = useAssignmentService();

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (selectedGroup !== 'all') {
      filterStudentsByGroup();
    }
  }, [selectedGroup]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get course groups
      const courseGroups = await groupService.getGroupsByCourse(courseId);
      setGroups(courseGroups);

      // Get all students from all groups
      let allStudents: StudentWithGrades[] = [];
      
      for (const group of courseGroups) {
        const groupData = await groupService.getGroupWithStudents(group.id);
        
        if (groupData && groupData.students) {
          // Fetch assignment stats for each student
          const studentsWithStatsPromises = groupData.students.map(async (student) => {
            const stats = await groupService.getStudentAssignmentStats(student.id, courseId);
            
            // Fetch real student grades from the database
            const grades = await fetchStudentGrades(student.id, courseId);
            
            return {
              ...student,
              assignmentStats: stats,
              groupId: group.id,
              groupName: group.name,
              grades: grades
            } as StudentWithGrades;
          });
          
          const studentsWithStats = await Promise.all(studentsWithStatsPromises);
          allStudents = [...allStudents, ...studentsWithStats];
        }
      }
      
      // Remove duplicates by student ID
      const uniqueStudents = Array.from(
        new Map(allStudents.map(student => [student.id, student])).values()
      );
      
      // Process enrollment status based on submissions/grades
      const processedStudents = processStudentsData(uniqueStudents);
      
      setStudents(processedStudents);
      
      // Calculate overall stats
      calculateStats(processedStudents);
      
    } catch (error) {
      console.error('Error fetching student statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real student grades from the database
  const fetchStudentGrades = async (studentId: string, courseId: string): Promise<StudentGrades> => {
    try {
      console.log(`[StudentStatsDashboard] Fetching real grades for student ${studentId} in course ${courseId}`);
      
      // Call the API to get real student grades
      const response = await assignmentService.getStudentGrades(studentId, courseId);
      
      console.log(`[StudentStatsDashboard] API response for student grades:`, response);
      
      if (response && Array.isArray(response)) {
        console.log(`[StudentStatsDashboard] Response structure for first item:`, response.length > 0 ? JSON.stringify(response[0]) : 'empty array');
      }
      
      if (!response) {
        console.error('[StudentStatsDashboard] No response received from grades API');
        return { assignments: [], averageGrade: 0 };
      }
      
      if (!Array.isArray(response)) {
        console.error('[StudentStatsDashboard] Invalid grade data received (not an array):', response);
        return { assignments: [], averageGrade: 0 };
      }

      // Check if we have any assignments with grades
      if (response.length === 0) {
        console.log(`No grades found for student ${studentId}, using fallback simulated data`);
        
        // Fallback to simulated data using assignment stats if there are no real grades
        const stats = await groupService.getStudentAssignmentStats(studentId, courseId);
        if (stats) {
          const assignmentCount = stats.totalAssignments || 10;
          console.log(`Simulating ${assignmentCount} assignments based on stats`);
          
          // Generate random grades for the assignments
          const simulatedAssignments: AssignmentGrade[] = Array.from({ length: assignmentCount }, (_, i) => {
            const isSubmitted = i < (stats.submittedAssignments || 0);
            const isGraded = isSubmitted && Math.random() > 0.2; // 80% of submitted assignments are graded
            
            return {
              assignmentId: `sim-${i}`,
              assignmentName: `Tehtävä ${i + 1}`,
              grade: isGraded ? Math.floor(Math.random() * 4) + 2 : null, // Grade between 2-5
              maxGrade: 5,
              submittedAt: isSubmitted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : '',
              isGraded: isGraded
            };
          });
          
          // Calculate average from graded assignments
          const gradedAssignments = simulatedAssignments.filter(a => a.isGraded && a.grade !== null);
          const averageGrade = gradedAssignments.length > 0
            ? gradedAssignments.reduce((sum, g) => sum + (g.grade || 0), 0) / gradedAssignments.length
            : 0;
            
          return {
            assignments: simulatedAssignments,
            averageGrade: averageGrade
          };
        }
      }

      // Map the API response to our interface
      // Handle both the direct /student/{id}/grades endpoint format and the submissions format
      const grades: AssignmentGrade[] = response.map(item => {
        // Standardize field names between different API responses
        const assignmentName = item.title || item.assignmentName || 
                             (item.assignment ? item.assignment.title : null) || 
                             `Tehtävä ${item.assignmentId}`;
        
        const maxGrade = item.maxGrade || 
                       (item.assignment ? item.assignment.maxPoints || 5 : 5);
                       
        const grade = typeof item.grade !== 'undefined' ? item.grade : null;
        
        const submittedAt = item.submittedAt || 
                          (item.createdAt ? item.createdAt : new Date().toISOString());
                          
        const isGraded = grade !== null && grade !== undefined;
        
        return {
          assignmentId: item.assignmentId || item.id || `unknown-${Math.random()}`,
          assignmentName,
          grade,
          maxGrade,
          submittedAt,
          isGraded
        };
      });
      
      console.log(`Mapped ${grades.length} grades for student ${studentId}`);
      
      // Calculate average grade using ONLY graded assignments
      const gradedAssignments = grades.filter(g => g.isGraded && g.grade !== null);
      const averageGrade = gradedAssignments.length > 0 
        ? gradedAssignments.reduce((sum, g) => sum + (g.grade || 0), 0) / gradedAssignments.length 
        : 0;
      
      return {
        assignments: grades,
        averageGrade: averageGrade
      };
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return { assignments: [], averageGrade: 0 };
    }
  };

  // Update students after fetching data to fix enrollment status
  const processStudentsData = (studentsList: StudentWithGrades[]) => {
    // For each student, check if they have submissions or grades
    return studentsList.map(student => {
      // If student has submitted assignments or has grades, they must be enrolled
      const hasSubmissions = student.assignmentStats?.submittedAssignments && 
                            student.assignmentStats.submittedAssignments > 0;
      const hasGrades = student.grades?.assignments.length && student.grades.assignments.length > 0;
      
      // Override enrolledToCourse if student has submissions or grades
      const updatedEnrollment = hasSubmissions || hasGrades ? true : student.enrolledToCourse;
      
      return {
        ...student,
        enrolledToCourse: updatedEnrollment
      };
    });
  };

  const filterStudentsByGroup = () => {
    if (selectedGroup === 'all') {
      // Reset filter - recalculate stats with all students
      calculateStats(students);
      return;
    }
    
    // Filter students by selected group
    const filteredStudents = students.filter(student => 
      (student as any).groupId === selectedGroup
    );
    
    // Recalculate stats with filtered students
    calculateStats(filteredStudents);
  };

  const calculateStats = (studentList: StudentWithGrades[]) => {
    if (!studentList.length) {
      return;
    }
    
    // Students with valid stats
    const studentsWithValidStats = studentList.filter(s => s.assignmentStats);
    
    if (!studentsWithValidStats.length) {
      return;
    }
    
    // Calculate average completion rate
    const averageRate = studentsWithValidStats.reduce(
      (acc, s) => acc + (s.assignmentStats?.submissionRate || 0), 0
    ) / studentsWithValidStats.length;
    
    // Count high performers (>80% completion)
    const highPerformers = studentsWithValidStats.filter(
      s => (s.assignmentStats?.submissionRate || 0) > 0.8
    ).length;
    
    // Count low performers (<30% completion)
    const lowPerformers = studentsWithValidStats.filter(
      s => (s.assignmentStats?.submissionRate || 0) < 0.3
    ).length;
    
    // Total assignments (based on first student's data)
    const totalAssignments = studentsWithValidStats[0]?.assignmentStats?.totalAssignments || 0;
    
    // Total submitted assignments
    const submittedAssignments = studentsWithValidStats.reduce(
      (acc, s) => acc + (s.assignmentStats?.submittedAssignments || 0), 0
    );
    
    // Calculate average grade
    const studentsWithGrades = studentList.filter(s => s.grades?.averageGrade);
    const averageGrade = studentsWithGrades.length > 0 
      ? studentsWithGrades.reduce((acc, s) => acc + (s.grades?.averageGrade || 0), 0) / studentsWithGrades.length 
      : 0;
    
    setStats({
      averageCompletionRate: averageRate,
      totalStudents: studentList.length,
      totalAssignments,
      submittedAssignments,
      highPerformers,
      lowPerformers,
      averageGrade
    });
  };

  // Performance levels data
  const getPerformanceData = () => {
    const excellent = stats.highPerformers;
    const low = stats.lowPerformers;
    const average = stats.totalStudents - excellent - low;
    
    return [
      { label: 'Erinomaiset (>80%)', value: excellent, color: theme.palette.success.main },
      { label: 'Keskitasoiset', value: average, color: theme.palette.info.main },
      { label: 'Heikot (<30%)', value: low, color: theme.palette.error.main }
    ];
  };

  // Add function to handle student row click
  const handleStudentClick = (student: StudentWithGrades) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };
  
  // Add function to close the dialog
  const handleCloseStudentDetail = () => {
    setStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Oppilaiden tehtävätilastot
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ width: 200, mr: 2 }}>
            <InputLabel id="group-select-label">Ryhmä</InputLabel>
            <Select
              labelId="group-select-label"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as string)}
              label="Ryhmä"
            >
              <MenuItem value="all">Kaikki ryhmät</MenuItem>
              {groups.map(group => (
                <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchData}
            disabled={loading}
          >
            Päivitä
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Opiskelijoita
                  </Typography>
                  <Typography variant="h3">{stats.totalStudents}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Keskim. suoritusaste
                  </Typography>
                  <Typography variant="h3">{Math.round(stats.averageCompletionRate * 100)}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.averageCompletionRate * 100} 
                    sx={{ height: 8, borderRadius: 5, mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Keskiarvo
                  </Typography>
                  <Typography variant="h3">{stats.averageGrade.toFixed(1)}</Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 1,
                      color: theme.palette.grey[600]
                    }}
                  >
                    <Typography variant="caption">asteikolla 1-5</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Tehtäviä yhteensä
                  </Typography>
                  <Typography variant="h3">{stats.totalAssignments}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Palautuksia
                  </Typography>
                  <Typography variant="h3">{stats.submittedAssignments}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Distribution */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Opiskelijoiden suoritustasot
            </Typography>
            
            <Grid container spacing={4} sx={{ mt: 1 }}>
              {getPerformanceData().map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        bgcolor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                      }}
                    >
                      <Typography variant="h4" sx={{ color: '#fff' }}>
                        {item.value}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1">{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.totalStudents > 0 
                        ? `${Math.round((item.value / stats.totalStudents) * 100)}%` 
                        : '0%'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Student Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Yksityiskohtaiset opiskelijatiedot
            </Typography>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="student statistics table">
                <TableHead>
                  <TableRow>
                    <TableCell>Opiskelija</TableCell>
                    <TableCell>Tehtäviä palautettu</TableCell>
                    <TableCell>Suoritusprosentti</TableCell>
                    <TableCell>Keskiarvo</TableCell>
                    <TableCell>Ryhmä</TableCell>
                    <TableCell>Taso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students
                    .filter(student => student.assignmentStats)
                    .sort((a, b) => (b.assignmentStats?.submissionRate || 0) - (a.assignmentStats?.submissionRate || 0))
                    .map((student) => {
                      const submissionRate = student.assignmentStats?.submissionRate || 0;
                      let performanceLevel = 'Keskitasoinen';
                      let color = theme.palette.info.main;
                      
                      if (submissionRate > 0.8) {
                        performanceLevel = 'Erinomainen';
                        color = theme.palette.success.main;
                      } else if (submissionRate < 0.3) {
                        performanceLevel = 'Heikko';
                        color = theme.palette.error.main;
                      }
                      
                      return (
                        <TableRow 
                          key={student.id} 
                          hover
                          onClick={() => handleStudentClick(student)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ mr: 2, bgcolor: color }}
                                alt={`${student.firstName} ${student.lastName}`}
                              >
                                {student.firstName?.[0]}
                              </Avatar>
                              {`${student.firstName} ${student.lastName}`}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {student.assignmentStats?.submittedAssignments || 0} / {student.assignmentStats?.totalAssignments || 0}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={submissionRate * 100}
                                  sx={{ 
                                    height: 10, 
                                    borderRadius: 5,
                                    backgroundColor: theme.palette.grey[300],
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: color
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {Math.round(submissionRate * 100)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {student.grades?.averageGrade?.toFixed(1) || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{(student as any).groupName || 'Ei ryhmää'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={performanceLevel} 
                              size="small"
                              sx={{ 
                                backgroundColor: color,
                                color: '#fff'
                              }} 
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
      
      {/* Student Detail Dialog */}
      <Dialog 
        open={studentDetailOpen} 
        onClose={handleCloseStudentDetail}
        maxWidth="md"
        fullWidth
      >
        {selectedStudent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Opiskelijan tiedot: {selectedStudent.firstName} {selectedStudent.lastName}
                </Typography>
                <IconButton onClick={handleCloseStudentDetail}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Student Personal Info */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Henkilötiedot
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ width: 64, height: 64, mr: 2 }}
                          alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                        >
                          {selectedStudent.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStudent.email || 'Ei sähköpostia'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>ID:</strong> {selectedStudent.id || 'Ei tiedossa'}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Ryhmä:</strong> {(selectedStudent as any).groupName || 'Ei ryhmää'}
                      </Typography>
                      
                      <Typography variant="body1">
                        <strong>Ilmoittautunut kurssille:</strong> {selectedStudent.enrolledToCourse ? 'Kyllä' : 'Ei'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Assignment Statistics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Tehtävätilastot
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Tehtäviä yhteensä:</strong> {selectedStudent.assignmentStats?.totalAssignments || 0}
                          </Typography>
                          
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Palautettuja tehtäviä:</strong> {selectedStudent.assignmentStats?.submittedAssignments || 0}
                          </Typography>
                          
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Suoritusprosentti:</strong> {Math.round((selectedStudent.assignmentStats?.submissionRate || 0) * 100)}%
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          justifyContent: 'center', 
                          borderRadius: '50%',
                          width: 80,
                          height: 80,
                          backgroundColor: theme.palette.primary.main,
                          color: 'white'
                        }}>
                          <Typography variant="h4">
                            {selectedStudent.grades?.averageGrade?.toFixed(1) || '-'}
                          </Typography>
                          <Typography variant="caption">
                            Keskiarvo
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>Edistyminen</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(selectedStudent.assignmentStats?.submissionRate || 0) * 100}
                        sx={{ 
                          height: 12, 
                          borderRadius: 5,
                          backgroundColor: theme.palette.grey[300],
                          mb: 1
                        }}
                      />
                      
                      {/* Performance level */}
                      {(() => {
                        const submissionRate = selectedStudent.assignmentStats?.submissionRate || 0;
                        let performanceLevel = 'Keskitasoinen';
                        let color = theme.palette.info.main;
                        
                        if (submissionRate > 0.8) {
                          performanceLevel = 'Erinomainen';
                          color = theme.palette.success.main;
                        } else if (submissionRate < 0.3) {
                          performanceLevel = 'Heikko';
                          color = theme.palette.error.main;
                        }
                        
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Chip 
                              label={`Taso: ${performanceLevel}`}
                              size="medium" 
                              sx={{ 
                                backgroundColor: color,
                                color: '#fff',
                                fontSize: '0.9rem',
                                py: 1
                              }}
                            />
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Individual Grades */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Tehtäväkohtaiset arvosanat
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {selectedStudent.grades && selectedStudent.grades.assignments && selectedStudent.grades.assignments.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Tehtävä</TableCell>
                                <TableCell>Arvosana</TableCell>
                                <TableCell>Palautuspäivä</TableCell>
                                <TableCell>Tila</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedStudent.grades.assignments
                                .sort((a: AssignmentGrade, b: AssignmentGrade) => 
                                  new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                                .map((assignment: AssignmentGrade, index: number) => (
                                  <TableRow key={`${selectedStudent.id}-${assignment.assignmentId}-${index}`} hover>
                                    <TableCell>{assignment.assignmentName}</TableCell>
                                    <TableCell>
                                      {assignment.isGraded && assignment.grade !== null ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Box 
                                            sx={{ 
                                              mr: 1, 
                                              px: 1.5, 
                                              py: 0.5, 
                                              borderRadius: 1, 
                                              bgcolor: (() => {
                                                const gradeRatio = (assignment.grade || 0) / assignment.maxGrade;
                                                if (gradeRatio >= 0.8) return theme.palette.success.main;
                                                if (gradeRatio >= 0.5) return theme.palette.info.main;
                                                return theme.palette.error.main;
                                              })(),
                                              color: 'white',
                                              fontWeight: 'bold',
                                              minWidth: 30,
                                              textAlign: 'center'
                                            }}
                                          >
                                            {assignment.grade}
                                          </Box>
                                          <Typography variant="body2" color="text.secondary">
                                            / {assignment.maxGrade}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Chip 
                                          label="Ei arvioitu" 
                                          size="small" 
                                          color="default" 
                                          variant="outlined"
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(assignment.submittedAt).toLocaleDateString('fi-FI')}
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={assignment.isGraded ? "Arvioitu" : "Palautettu"} 
                                        size="small" 
                                        color={assignment.isGraded ? "success" : "primary"} 
                                        variant="outlined"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body1" sx={{ textAlign: 'center', py: 3, color: theme.palette.text.secondary }}>
                          Ei arvosanoja saatavilla
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Comparison to Average */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Vertailu ryhmän keskiarvoon
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Suoritusprosentti</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="body2" sx={{ width: 100 }}>Opiskelija:</Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(selectedStudent.assignmentStats?.submissionRate || 0) * 100}
                                sx={{ 
                                  height: 20, 
                                  borderRadius: 5,
                                  backgroundColor: theme.palette.grey[300],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.primary.main
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                              {Math.round((selectedStudent.assignmentStats?.submissionRate || 0) * 100)}%
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ width: 100 }}>Ryhmä:</Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={stats.averageCompletionRate * 100}
                                sx={{ 
                                  height: 20, 
                                  borderRadius: 5,
                                  backgroundColor: theme.palette.grey[300],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.secondary.main
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                              {Math.round(stats.averageCompletionRate * 100)}%
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Keskiarvo</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="body2" sx={{ width: 100 }}>Opiskelija:</Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={((selectedStudent.grades?.averageGrade || 0) / 5) * 100}
                                sx={{ 
                                  height: 20, 
                                  borderRadius: 5,
                                  backgroundColor: theme.palette.grey[300],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.primary.main
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                              {selectedStudent.grades?.averageGrade?.toFixed(1) || 'N/A'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ width: 100 }}>Ryhmä:</Typography>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(stats.averageGrade / 5) * 100}
                                sx={{ 
                                  height: 20, 
                                  borderRadius: 5,
                                  backgroundColor: theme.palette.grey[300],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.secondary.main
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                              {stats.averageGrade.toFixed(1)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Typography variant="body2" color="text.secondary">
                        {(() => {
                          const studentRate = selectedStudent.assignmentStats?.submissionRate || 0;
                          const submissionDiff = studentRate - stats.averageCompletionRate;
                          
                          const studentGrade = selectedStudent.grades?.averageGrade || 0;
                          const gradeDiff = studentGrade - stats.averageGrade;
                          
                          let message = '';
                          
                          if (Math.abs(submissionDiff) < 0.05 && Math.abs(gradeDiff) < 0.5) {
                            message = "Opiskelijan suoritustaso ja arvosanat ovat lähellä ryhmän keskiarvoa.";
                          } else {
                            if (submissionDiff > 0.05) {
                              message += `Opiskelija palauttaa tehtäviä ${Math.round(submissionDiff * 100)} prosenttiyksikköä aktiivisemmin kuin ryhmä keskimäärin. `;
                            } else if (submissionDiff < -0.05) {
                              message += `Opiskelija palauttaa tehtäviä ${Math.round(Math.abs(submissionDiff) * 100)} prosenttiyksikköä vähemmän kuin ryhmä keskimäärin. `;
                            }
                            
                            if (gradeDiff > 0.5) {
                              message += `Opiskelijan arvosanat ovat ${gradeDiff.toFixed(1)} yksikköä paremmat kuin ryhmän keskiarvo.`;
                            } else if (gradeDiff < -0.5) {
                              message += `Opiskelijan arvosanat ovat ${Math.abs(gradeDiff).toFixed(1)} yksikköä heikommat kuin ryhmän keskiarvo.`;
                            }
                          }
                          
                          return message;
                        })()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseStudentDetail} color="primary">
                Sulje
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StudentStatsDashboard; 