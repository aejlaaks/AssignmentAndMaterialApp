import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courses/courseService';
import { groupService, ISchoolGroup, IStudent } from '../services/courses/groupService';
import { submissionService, ISubmission } from '../services/assignments/submissionService';
import { assignmentService } from '../services/assignments/assignmentService';
import { Course } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TeacherCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseGroups, setCourseGroups] = useState<ISchoolGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [courseStudents, setCourseStudents] = useState<IStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<IStudent[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<{[key: string]: ISubmission[]}>({});
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [courseAssignmentIds, setCourseAssignmentIds] = useState<string[]>([]);

  // Haetaan opettajan kurssit
  useEffect(() => {
    const fetchTeacherCourses = async () => {
      try {
        setLoading(true);
        const fetchedCourses = await courseService.getCourses();
        console.log('Opettajan kurssit:', fetchedCourses);
        setCourses(fetchedCourses);
        setLoading(false);
      } catch (err) {
        console.error('Virhe kurssien haussa:', err);
        setError('Kurssien hakeminen epäonnistui. Yritä myöhemmin uudelleen.');
        setLoading(false);
      }
    };

    fetchTeacherCourses();
  }, []);

  // Haetaan valitun kurssin ryhmät ja opiskelijat
  useEffect(() => {
    if (selectedCourse) {
      const fetchCourseDetails = async () => {
        try {
          setLoading(true);
          
          // Haetaan kurssin ryhmät
          const groups = await groupService.getGroupsByCourse(selectedCourse.id);
          console.log('Kurssin ryhmät:', groups);
          setCourseGroups(groups);
          
          // Haetaan kurssin opiskelijat
          const students = await courseService.getCourseStudents(selectedCourse.id);
          console.log('Kurssin opiskelijat:', students);
          setCourseStudents(students);
          setFilteredStudents(students);
          
          setLoading(false);
        } catch (err) {
          console.error('Virhe kurssin tietojen haussa:', err);
          setError('Kurssin tietojen hakeminen epäonnistui. Yritä myöhemmin uudelleen.');
          setLoading(false);
        }
      };

      fetchCourseDetails();
    }
  }, [selectedCourse]);

  // Suodatetaan opiskelijat valitun ryhmän mukaan
  useEffect(() => {
    if (selectedGroup === 'all') {
      setFilteredStudents(courseStudents);
    } else {
      const group = courseGroups.find(g => g.id === selectedGroup);
      if (group && group.students) {
        const groupStudentIds = group.students.map(s => s.id);
        const filtered = courseStudents.filter(student => 
          groupStudentIds.includes(student.id)
        );
        setFilteredStudents(filtered);
      } else {
        setFilteredStudents([]);
      }
    }
  }, [selectedGroup, courseStudents, courseGroups]);

  // Haetaan opiskelijoiden palautukset
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const fetchStudentSubmissions = async () => {
        try {
          const submissionsMap: {[key: string]: ISubmission[]} = {};
          
          for (const student of filteredStudents) {
            try {
              const submissions = await submissionService.getSubmissionsByStudent(student.id);
              submissionsMap[student.id] = submissions;
            } catch (studentErr) {
              console.error(`Virhe opiskelijan ${student.id} palautusten haussa:`, studentErr);
              submissionsMap[student.id] = []; // Tyhjä array virhetilanteessa
            }
          }
          
          setStudentSubmissions(submissionsMap);
        } catch (err) {
          console.error('Virhe palautusten haussa:', err);
        }
      };

      fetchStudentSubmissions();
    }
  }, [filteredStudents]);

  // Päivitetään useEffect, joka hakee kurssin tehtävät
  useEffect(() => {
    const fetchCourseAssignments = async () => {
      if (!selectedCourse) return;
      
      try {
        setLoading(true);
        const assignments = await assignmentService.getAssignmentsByCourse(selectedCourse.id);
        setCourseAssignments(assignments);
        
        // Tallennetaan kurssin tehtävien ID:t
        const assignmentIds = assignments.map(assignment => assignment.id);
        setCourseAssignmentIds(assignmentIds);
      } catch (err) {
        console.error('Error fetching course assignments:', err);
        setError('Tehtävien hakeminen epäonnistui.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedCourse) {
      fetchCourseAssignments();
    }
  }, [selectedCourse]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setTabValue(0);
    setSelectedGroup('all');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGroupChange = (event: SelectChangeEvent<string>) => {
    setSelectedGroup(event.target.value);
  };

  const handleViewSubmission = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };

  const handleViewAssignment = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const getStatusChip = (status: string) => {
    if (!status) return <Chip label="Ei tietoa" size="small" />;
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'submitted':
        return <Chip label="Palautettu" color="primary" size="small" />;
      case 'graded':
      case 'completed':
        return <Chip label="Arvioitu" color="success" size="small" />;
      case 'returned':
        return <Chip label="Palautettu opiskelijalle" color="warning" size="small" />;
      case 'published':
        return <Chip label="Julkaistu" color="info" size="small" />;
      case 'draft':
        return <Chip label="Luonnos" color="default" size="small" />;
      case 'inprogress':
        return <Chip label="Kesken" color="info" size="small" />;
      case 'archived':
        return <Chip label="Myöhässä" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading && courses.length === 0) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && courses.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageHeader title="Opettajan kurssit" />
      
      {!selectedCourse ? (
        // Kurssien listaus
        <Grid container spacing={3}>
          {courses.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                Sinulla ei ole vielä kursseja. Luo uusi kurssi aloittaaksesi.
              </Alert>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/courses/create')}
                sx={{ mt: 2 }}
              >
                Luo uusi kurssi
              </Button>
            </Grid>
          ) : (
            courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {course.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {course.studentCount || 0} opiskelijaa
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handleCourseSelect(course)}
                    >
                      Näytä opiskelijat ja palautukset
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        // Valitun kurssin näkymä
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2">
              {selectedCourse.name}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setSelectedCourse(null)}
            >
              Takaisin kursseihin
            </Button>
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="course tabs">
              <Tab label="Opiskelijat" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Ryhmät" icon={<GroupIcon />} iconPosition="start" />
              <Tab label="Tehtävät" icon={<AssignmentIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          {/* Opiskelijat-välilehti */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel id="group-filter-label">Suodata ryhmän mukaan</InputLabel>
                <Select
                  labelId="group-filter-label"
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  label="Suodata ryhmän mukaan"
                >
                  <MenuItem value="all">Kaikki opiskelijat</MenuItem>
                  {courseGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                {filteredStudents.length} opiskelijaa
              </Typography>
            </Box>
            
            {loading ? (
              <CircularProgress />
            ) : filteredStudents.length === 0 ? (
              <Alert severity="info">
                Ei opiskelijoita valitussa ryhmässä.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nimi</TableCell>
                      <TableCell>Sähköposti</TableCell>
                      <TableCell>Ryhmät</TableCell>
                      <TableCell>Palautukset</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const studentGroups = courseGroups.filter(group => 
                        group.students?.some(s => s.id === student.id)
                      );
                      const submissions = studentSubmissions[student.id] || [];
                      
                      // Suodatetaan palautukset, jotka liittyvät kurssin tehtäviin
                      const courseSubmissions = submissions.filter(sub => 
                        sub.assignmentId && courseAssignmentIds.includes(sub.assignmentId)
                      );
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            {studentGroups.map(group => (
                              <Chip 
                                key={group.id} 
                                label={group.name} 
                                size="small" 
                                sx={{ mr: 0.5, mb: 0.5 }} 
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            {courseSubmissions.length} / {courseAssignmentIds.length} palautusta
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
          
          {/* Ryhmät-välilehti */}
          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <CircularProgress />
            ) : courseGroups.length === 0 ? (
              <Alert severity="info">
                Kurssilla ei ole vielä ryhmiä. Luo uusi ryhmä aloittaaksesi.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {courseGroups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {group.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {group.description}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {group.students?.length || 0} opiskelijaa
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => setSelectedGroup(group.id)}
                        >
                          Näytä opiskelijat
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/groups/${group.id}`)}
                        >
                          Hallinnoi ryhmää
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
          
          {/* Tehtävät-välilehti */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate(`/assignments/create?courseId=${selectedCourse.id}`)}
              >
                Lisää uusi tehtävä
              </Button>
            </Box>
            
            {loading ? (
              <CircularProgress />
            ) : courseAssignments.length === 0 ? (
              <Alert severity="info">
                Kurssilla ei ole vielä tehtäviä.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tehtävän nimi</TableCell>
                      <TableCell>Kuvaus</TableCell>
                      <TableCell>Deadline</TableCell>
                      <TableCell>Tila</TableCell>
                      <TableCell>Palautuksia</TableCell>
                      <TableCell>Toiminnot</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.title}</TableCell>
                        <TableCell>
                          {assignment.description?.length > 100 
                            ? `${assignment.description.substring(0, 100)}...` 
                            : assignment.description}
                        </TableCell>
                        <TableCell>
                          {assignment.dueDate 
                            ? new Date(assignment.dueDate).toLocaleDateString('fi-FI') 
                            : 'Ei määritetty'}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(assignment.status)}
                        </TableCell>
                        <TableCell>
                          {assignment.submissionCount || 0} / {courseStudents.length}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Näytä tehtävä">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewAssignment(assignment.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Muokkaa tehtävää">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/assignments/edit/${assignment.id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Box>
      )}
    </Container>
  );
};

export default TeacherCourses; 