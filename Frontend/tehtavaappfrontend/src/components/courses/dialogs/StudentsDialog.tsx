import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  Box,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemIcon,
  OutlinedInput,
  LinearProgress,
  Tooltip,
  Grid,
  Badge
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { SchoolGroup } from '../../../types';
import { IStudent, groupService } from '../../../services/courses/groupService';
import { IStudentWithStats, AssignmentStats } from '../../../interfaces/services/IGroupService';

// Define interfaces for grade data similar to StudentStatsDashboard
interface AssignmentGrade {
  assignmentId: string;
  assignmentName: string;
  grade: number;
  maxGrade: number;
  submittedAt: string;
}

interface StudentGrades {
  assignments: AssignmentGrade[];
  averageGrade: number;
}

// Extend the IStudentWithStats for our component
interface StudentWithGrades extends IStudentWithStats {
  grades?: StudentGrades;
}

interface StudentsDialogProps {
  open: boolean;
  onClose: () => void;
  group: SchoolGroup | null;
  courseId: string;
  canManage?: boolean;
  onGroupsChange?: () => void;
}

const StudentsDialog: React.FC<StudentsDialogProps> = ({
  open,
  onClose,
  group,
  courseId,
  canManage = false,
  onGroupsChange
}) => {
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<IStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [studentsWithStats, setStudentsWithStats] = useState<StudentWithGrades[]>([]);
  const [groupStats, setGroupStats] = useState({
    averageCompletionRate: 0,
    studentsCount: 0,
    averageGrade: 0
  });

  useEffect(() => {
    if (open && group) {
      fetchAvailableStudents();
      if (courseId) {
        fetchStudentStats();
      }
    }
  }, [open, group, courseId]);

  const fetchAvailableStudents = async () => {
    if (!group) return;
    
    try {
      setLoadingAvailableStudents(true);
      const students = await groupService.getAvailableStudents(group.id);
      setAvailableStudents(students);
    } catch (error) {
      console.error('Virhe haettaessa opiskelijoita:', error);
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  // Simulate fetching student grades - similar to StudentStatsDashboard
  const fetchStudentGrades = async (studentId: string, courseId: string): Promise<StudentGrades> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Get the student's assignment stats to ensure consistency
    const stats = await groupService.getStudentAssignmentStats(studentId, courseId);
    
    // Only generate grades for assignments that have been submitted
    const submittedCount = stats ? stats.submittedAssignments : 0;
    const grades: AssignmentGrade[] = [];
    
    // Generate grades only for submitted assignments
    for (let i = 0; i < submittedCount; i++) {
      const grade = Math.floor(Math.random() * 5) + 1; // Grades 1-5
      grades.push({
        assignmentId: `assignment-${i}`,
        assignmentName: `Tehtävä ${i + 1}`,
        grade: grade,
        maxGrade: 5,
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
      });
    }
    
    // Calculate average grade (prevent division by zero)
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length 
      : 0;
    
    return {
      assignments: grades,
      averageGrade: averageGrade
    };
  };

  const fetchStudentStats = async () => {
    if (!group || !courseId) return;
    
    try {
      setStatsLoading(true);
      const groupWithStudents = await groupService.getGroupWithStudents(group.id);
      
      if (!groupWithStudents || !groupWithStudents.students) {
        setStatsLoading(false);
        return;
      }
      
      // Fetch assignment stats for each student
      const studentsWithStatsPromises = groupWithStudents.students.map(async (student) => {
        const stats = await groupService.getStudentAssignmentStats(student.id, courseId);
        
        // Verify that the stats make sense - we should have non-zero total assignments
        // if a student has grades or submissions
        if (stats && stats.totalAssignments === 0 && stats.submittedAssignments > 0) {
          // Fix the stats to show the correct number of assignments
          stats.totalAssignments = stats.submittedAssignments;
          stats.submissionRate = 1.0; // 100% submission rate
        }
        
        // Fetch student grades - simulating this functionality
        const grades = await fetchStudentGrades(student.id, courseId);
        
        return {
          ...student,
          assignmentStats: stats,
          grades: grades
        } as StudentWithGrades;
      });
      
      const resolvedStudentsWithStats = await Promise.all(studentsWithStatsPromises);
      setStudentsWithStats(resolvedStudentsWithStats);
      
      // Calculate group stats
      const studentsWithValidStats = resolvedStudentsWithStats.filter(s => s.assignmentStats);
      const averageRate = studentsWithValidStats.length 
        ? studentsWithValidStats.reduce((acc, s) => acc + (s.assignmentStats?.submissionRate || 0), 0) / studentsWithValidStats.length
        : 0;
      
      // Calculate average grade for the group
      const studentsWithGrades = resolvedStudentsWithStats.filter(s => s.grades?.averageGrade);
      const averageGrade = studentsWithGrades.length 
        ? studentsWithGrades.reduce((acc, s) => acc + (s.grades?.averageGrade || 0), 0) / studentsWithGrades.length
        : 0;
      
      setGroupStats({
        averageCompletionRate: averageRate,
        studentsCount: resolvedStudentsWithStats.length,
        averageGrade: averageGrade
      });
      
    } catch (error) {
      console.error('Virhe haettaessa opiskelijoiden tehtävätilastoja:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAddStudentsToGroup = async () => {
    if (!group) return;
    
    try {
      setLoading(true);
      
      // Add each student individually
      for (const studentId of selectedStudentIds) {
        await groupService.addStudentToGroup(group.id, studentId);
      }
      
      // Refresh the group data
      setAddStudentsDialogOpen(false);
      setSelectedStudentIds([]);
      
      // Close the dialog and notify the parent component
      onClose();
    } catch (error) {
      console.error('Virhe lisättäessä opiskelijoita ryhmään:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCourseFromGroup = async () => {
    if (!group || !courseId) return;
    
    if (window.confirm('Haluatko varmasti poistaa tämän kurssin ryhmästä?')) {
      try {
        setLoading(true);
        const result = await groupService.removeCourseFromGroup(group.id, courseId);
        
        if (result.success) {
          // Close the dialog first
          onClose();
          
          // Notify parent about the change to refresh group data
          if (onGroupsChange) {
            onGroupsChange();
          }
        } else {
          alert(`Virhe poistettaessa kurssia: ${result.error || 'Tuntematon virhe'}`);
        }
      } catch (error) {
        console.error('Virhe poistettaessa kurssia ryhmästä:', error);
        alert('Virhe poistettaessa kurssia ryhmästä');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveStudentFromGroup = async (studentId: string) => {
    if (!group) return;
    
    if (window.confirm('Haluatko varmasti poistaa opiskelijan ryhmästä?')) {
      try {
        setLoading(true);
        await groupService.removeStudentFromGroup(group.id, studentId);
        console.log(`Removing student ${studentId} from group ${group.id}`);
        
        // Refresh student stats if course ID is available
        if (courseId) {
          await fetchStudentStats();
        }
        
        // Close the dialog and notify the parent component
        onClose();
      } catch (error) {
        console.error('Virhe poistettaessa opiskelijaa ryhmästä:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getEnrolledStudents = () => {
    return studentsWithStats.filter(student => student.enrolledToCourse === true);
  };

  const getNonEnrolledStudents = () => {
    return studentsWithStats.filter(student => !student.enrolledToCourse);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {group ? `Ryhmän ${group.name} opiskelijat` : 'Opiskelijat'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Group Assignment Statistics */}
              {courseId && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Tehtävien palautustilastot</Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={fetchStudentStats}
                      disabled={statsLoading}
                    >
                      Päivitä tilastot
                    </Button>
                  </Box>
                  
                  {statsLoading ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Keskimääräinen palautusprosentti
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          {Math.round(groupStats.averageCompletionRate * 100)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={groupStats.averageCompletionRate * 100} 
                          sx={{ height: 10, borderRadius: 5, my: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Keskiarvo
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          {groupStats.averageGrade.toFixed(1)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(groupStats.averageGrade / 5) * 100} 
                          sx={{ height: 10, borderRadius: 5, my: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Opiskelijoita: {groupStats.studentsCount}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Kurssille ilmoittautuneet opiskelijat ({getEnrolledStudents().length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddStudentsDialogOpen(true)}
                >
                  Lisää opiskelijoita
                </Button>
              </Box>
              
              {getEnrolledStudents().length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                  Ei kurssille ilmoittautuneita opiskelijoita
                </Typography>
              ) : (
                <List>
                  {getEnrolledStudents().map((student) => (
                    <ListItem key={student.id} sx={{ 
                      flexDirection: { xs: 'column', sm: 'row' }, 
                      alignItems: { xs: 'flex-start', sm: 'center' }
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <ListItemText
                            primary={`${student.firstName} ${student.lastName}`}
                            secondary={student.email}
                          />
                        </Grid>
                        
                        {courseId && student.assignmentStats && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AssignmentIcon fontSize="small" sx={{ mr: 0.5 }} />
                                  Tehtävät: {student.assignmentStats.submittedAssignments}/{student.assignmentStats.totalAssignments}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Tooltip title="Palautettujen tehtävien prosentti">
                                    <Typography variant="body2" fontWeight="bold" sx={{ mr: 1.5 }}>
                                      {Math.round(student.assignmentStats.submissionRate * 100)}%
                                    </Typography>
                                  </Tooltip>
                                  <Tooltip title="Keskiarvo">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <GradeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                      <Typography variant="body2" fontWeight="bold">
                                        {student.grades?.averageGrade?.toFixed(1) || '-'}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                </Box>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={student.assignmentStats.submissionRate * 100} 
                                sx={{ height: 6, borderRadius: 5 }}
                              />
                            </Box>
                          </Grid>
                        )}
                        
                        {canManage && (
                          <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveStudentFromGroup(student.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        )}
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                Muut ryhmän opiskelijat ({getNonEnrolledStudents().length})
              </Typography>
              
              {getNonEnrolledStudents().length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Ei muita opiskelijoita ryhmässä
                </Typography>
              ) : (
                <List>
                  {getNonEnrolledStudents().map((student) => (
                    <ListItem key={student.id} sx={{ 
                      flexDirection: { xs: 'column', sm: 'row' }, 
                      alignItems: { xs: 'flex-start', sm: 'center' }
                    }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <ListItemText
                            primary={`${student.firstName} ${student.lastName}`}
                            secondary={student.email}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={5}>
                          <Chip
                            label="Ei ilmoittautunut kurssille"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        </Grid>
                        
                        {canManage && (
                          <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveStudentFromGroup(student.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        )}
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          {canManage && group && (
            <Button 
              onClick={handleRemoveCourseFromGroup} 
              color="error"
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Poista kurssilta
            </Button>
          )}
          <Button onClick={onClose}>Sulje</Button>
        </DialogActions>
      </Dialog>

      {/* Add Students Dialog */}
      <Dialog
        open={addStudentsDialogOpen}
        onClose={() => setAddStudentsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Lisää opiskelijoita ryhmään</DialogTitle>
        <DialogContent>
          {loadingAvailableStudents ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {availableStudents.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Ei saatavilla olevia opiskelijoita
                </Typography>
              ) : (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="students-select-label">Opiskelijat</InputLabel>
                  <Select
                    labelId="students-select-label"
                    multiple
                    value={selectedStudentIds}
                    onChange={(e) => setSelectedStudentIds(e.target.value as string[])}
                    input={<OutlinedInput label="Opiskelijat" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((studentId) => {
                          const student = availableStudents.find(s => s.id === studentId);
                          return (
                            <Chip
                              key={studentId}
                              label={student ? `${student.firstName} ${student.lastName}` : studentId}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {availableStudents.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        <Checkbox checked={selectedStudentIds.indexOf(student.id) > -1} />
                        <ListItemText
                          primary={`${student.firstName} ${student.lastName}`}
                          secondary={student.email}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentsDialogOpen(false)}>
            Peruuta
          </Button>
          <Button
            onClick={handleAddStudentsToGroup}
            variant="contained"
            color="primary"
            disabled={selectedStudentIds.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Lisää opiskelijat'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StudentsDialog; 