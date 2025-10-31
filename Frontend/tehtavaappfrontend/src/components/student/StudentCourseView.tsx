import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider
} from '@mui/material';
import {
  Book as BookIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { courseService } from '../../services/courses/courseService';
import { materialService } from '../../services/materials/materialService';
import { assignmentService } from '../../services/assignments/assignmentService';
import { authService } from '../../services/auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { formatDate } from '../../utils/dateUtils';
import { filterValidBlocks, logBlocksInfo } from '../../utils/blockUtils';
import { Course, Material, UserRole } from '../../types';
import { Assignment } from '../../types/assignment';
import { useAuthStatus, useAuthActions } from '../../hooks/useRedux';
import { Block } from '../../types/blocks';
import { StudentBlockListNew, BlockDebugger } from '../blocks';

// Environment check for development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Extended Course interface to include teachers and content blocks
interface ExtendedCourse extends Course {
  teachers?: { id: string; name: string }[];
  contentBlocks?: Block[];
}

// Extended Material interface to include file properties
interface ExtendedMaterial extends Material {
  description?: string;
  fileName?: string;
}

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
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2 }, width: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `course-tab-${index}`,
    'aria-controls': `course-tabpanel-${index}`,
  };
};

// Debug component for course blocks
const BlocksDebugView = ({ blocks }: { blocks: any[] | undefined }) => {
  if (!blocks || blocks.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2, bgcolor: '#ffeeee' }}>
        <Typography color="error">No blocks found</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2, bgcolor: '#eeeeff' }}>
      <Typography variant="h6">Found {blocks.length} blocks:</Typography>
      {blocks.map((block, index) => (
        <div key={block.id || index}>
          <Typography>
            ID: {block.id}, Type: {block.type}, Title: {block.title}
          </Typography>
        </div>
      ))}
    </Paper>
  );
};

const StudentCourseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = id; // Use the id from the URL parameter
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  
  const [course, setCourse] = useState<ExtendedCourse | null>(null);
  const [materials, setMaterials] = useState<ExtendedMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Debug the received courseId
  useEffect(() => {
    console.log('StudentCourseView - URL params:', { id, courseId });
  }, [id, courseId]);

  // Direct API test function - this should work regardless of service implementation
  useEffect(() => {
    const testDirectApiCall = async () => {
      if (!courseId) return;
      
      try {
        console.log('DIRECT TEST: Making direct fetch to API');
        const token = authService.getToken();
        
        if (!token) {
          console.error('DIRECT TEST: No auth token available');
          return;
        }
        
        console.log(`DIRECT TEST: Fetching course ${courseId} from ${API_URL}/course/${courseId}`);
        
        const response = await fetch(`${API_URL}/course/${courseId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`DIRECT TEST: Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          console.error(`DIRECT TEST: API returned error ${response.status}`);
          return;
        }
        
        const data = await response.json();
        console.log('DIRECT TEST: API returned data:', data);
        
        if (data && data.id) {
          console.log(`DIRECT TEST: Successfully fetched course ${data.id} - ${data.name}`);
        } else {
          console.error('DIRECT TEST: API returned invalid data structure');
        }
      } catch (err) {
        console.error('DIRECT TEST: Error making direct API call:', err);
      }
    };
    
    testDirectApiCall();
  }, [courseId]);

  // Check if user is authenticated and is a student
  useEffect(() => {
    console.log('StudentCourseView - Auth check:', {
      authLoading,
      isAuthenticated,
      userRole: user?.role,
      normalizedRole: user?.role ? String(user.role).toLowerCase() : null,
      courseId,
      path: window.location.pathname
    });

    // Only perform redirection if authentication is complete
    if (!authLoading) {
      if (!isAuthenticated) {
        // Not authenticated - redirect to login
        console.log('User not authenticated, redirecting to login');
        navigate('/login');
        return; // Add return to prevent further execution
      }
      
      // Get normalized role for case-insensitive comparison
      const userRole = String(user?.role || '').toLowerCase();
      
      // Allow students, teachers and admins to view student course view
      const allowedRoles = ['student', 'teacher', 'admin'];
      
      if (!allowedRoles.includes(userRole)) {
        console.log('User role not allowed:', userRole);
        navigate('/dashboard');
        return; // Add return to prevent further execution
      }
      
      console.log('User authorized to view student course view:', {
        userRole,
        courseId: courseId
      });
    }
  }, [authLoading, isAuthenticated, user, navigate, courseId]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || authLoading || !isAuthenticated) {
        console.log('Skipping fetch - missing prerequisites:', { courseId, authLoading, isAuthenticated });
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`=== COURSE FETCH START ===`);
        console.log(`Attempting to fetch course ${courseId} for student ${user?.id}`);
        
        // Check if the student is enrolled in this course
        console.log(`Checking enrollment for course ${courseId}...`);
        let isEnrolled = true;
        
        try {
          isEnrolled = await courseService.checkEnrollment(courseId);
          console.log(`Enrollment check result: ${isEnrolled ? 'Enrolled' : 'Not enrolled'}`);
        } catch (enrollError) {
          console.error('Error checking enrollment:', enrollError);
          // Continue with true to avoid blocking access
          isEnrolled = true;
        }
        
        if (!isEnrolled) {
          console.log('User is not enrolled in this course');
          setError('Et ole ilmoittautunut tälle kurssille.');
          setLoading(false);
          return;
        }
        
        // Fetch course details directly
        console.log(`Fetching course details for ID: ${courseId}`);
        try {
          const courseData = await courseService.getCourseById(courseId);
          console.log(`Course data fetch result:`, courseData);
          
          if (!courseData) {
            console.error('Course data is null or undefined');
            setError('Kurssia ei löytynyt tai sinulla ei ole oikeuksia tarkastella sitä.');
            setLoading(false);
            return;
          }
          
          // Set the course with empty blocks if needed
          const courseWithBlocks = {
            ...courseData,
            contentBlocks: courseData.contentBlocks || []
          };
          
          console.log('Setting course state with data:', courseWithBlocks);
          setCourse(courseWithBlocks);
          
          // Fetch materials and assignments in parallel
          console.log(`Fetching additional data for course ${courseId}`);
          
          Promise.all([
            materialService.getMaterials(courseId).catch(e => { 
              console.error('Materials fetch error:', e); 
              return []; 
            }),
            assignmentService.getAssignmentsByCourse(courseId).catch(e => { 
              console.error('Assignments fetch error:', e); 
              return []; 
            })
          ]).then(([materialsData, assignmentsData]) => {
            setMaterials(materialsData as ExtendedMaterial[]);
            setAssignments(assignmentsData);
            console.log(`Loaded ${materialsData.length} materials and ${assignmentsData.length} assignments`);
          }).catch(err => {
            console.error('Error fetching related data:', err);
          });
        } catch (courseError) {
          console.error('Error fetching course data:', courseError);
          setError('Kurssia ei voitu ladata. Yritä uudelleen.');
        }
        
        console.log(`=== END SIMPLIFIED COURSE FETCH ===`);
      } catch (err) {
        console.error('=== ERROR IN COURSE FETCH ===', err);
        setError('Kurssin tietojen lataaminen epäonnistui. Yritä uudelleen.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, authLoading, isAuthenticated, user?.id]);

  // Debug log effect for blocks
  useEffect(() => {
    // This will help us see if course data is being fetched properly
    console.log("========= DEBUG: StudentCourseView Debug Log =========");
    console.log("Course ID from params:", courseId);
    console.log("User auth state:", { 
      userId: user?.id,
      role: user?.role,
      isAuthenticated,
      authLoading
    });
    
    if (course) {
      console.log("Course received:", {
        id: course.id,
        name: course.name,
        hasContentBlocks: !!course.contentBlocks,
        blocksLength: course.contentBlocks?.length || 0
      });
    } else {
      console.log("Course is null or undefined");
    }
    
    if (course?.contentBlocks && course.contentBlocks.length > 0) {
      console.log("Has blocks to render");
      console.log("First block:", course.contentBlocks[0]);
    } else {
      console.log("No blocks to render");
    }
    
    if (error) {
      console.log("Error state is set:", error);
    }
    
    console.log("Loading state:", loading);
    console.log("========= END DEBUG LOG =========");
  }, [course, courseId, user, isAuthenticated, authLoading, error, loading]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDownloadMaterial = async (materialId: string, fileName: string) => {
    try {
      await materialService.downloadMaterial(materialId, fileName);
    } catch (err) {
      console.error('Error downloading material:', err);
      alert('Materiaalin lataaminen epäonnistui. Yritä uudelleen.');
    }
  };

  const handleOpenAssignment = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Ladataan kurssin tietoja...
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Haetaan kurssia tunnisteella {courseId}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 2, my: 4 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="caption" color="text.secondary">
              Tämä voi kestää hetken
            </Typography>
          </Box>
          
          <Button 
            variant="text"
            onClick={() => navigate('/courses')}
            sx={{ mt: 2 }}
          >
            Takaisin kurssilistaukseen
          </Button>
        </Paper>
        <Typography variant="h5" gutterBottom>Loading course content...</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="error">
            Virhe kurssin lataamisessa
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/courses')}
            >
              Takaisin kurssilistaukseen
            </Button>
            
            <Button 
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Yritä uudelleen
            </Button>
          </Box>
        </Paper>
        
        {/* Show additional help information */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mahdollisia syitä:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                Et ole rekisteröitynyt tälle kurssille
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Kurssi ei ole enää saatavilla tai se on poistettu
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Verkkoyhteysongelma
              </Typography>
            </li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Jos ongelma jatkuu, ota yhteyttä kurssin opettajaan tai järjestelmänvalvojaan.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="warning.main">
            Kurssin tietoja ei voitu ladata
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Kurssin tietoja ei ole saatavilla. Yritä myöhemmin uudelleen.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/courses')}
            >
              Takaisin kurssilistaukseen
            </Button>
            
            <Button 
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Yritä uudelleen
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/courses')}
          sx={{ mb: 2 }}
        >
          Takaisin kurssilistaukseen
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {course.startDate && (
            <Chip 
              label={`Alkaa: ${formatDate(course.startDate)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {course.endDate && (
            <Chip 
              label={`Päättyy: ${formatDate(course.endDate)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="course tabs"
          variant="fullWidth"
        >
          <Tab 
            label="Kurssin tiedot" 
            {...a11yProps(0)} 
          />
          <Tab 
            label="Sisältö" 
            icon={<DashboardIcon />} 
            iconPosition="start"
            {...a11yProps(1)} 
          />
          <Tab 
            label="Materiaalit" 
            icon={<BookIcon />} 
            iconPosition="start"
            {...a11yProps(2)} 
          />
          <Tab 
            label="Tehtävät" 
            icon={<AssignmentIcon />} 
            iconPosition="start"
            {...a11yProps(3)} 
          />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Kurssin kuvaus
          </Typography>
          <Typography paragraph>
            {course.description || 'Ei kuvausta'}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Kurssin opettajat
          </Typography>
          <Box sx={{ mt: 2 }}>
            {course.teacherName && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1">
                  {course.teacherName}
                  <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                    (Kurssin pääopettaja)
                  </Typography>
                </Typography>
              </Paper>
            )}
            
            {course.teachers && course.teachers.length > 0 ? (
              course.teachers.map((teacher, index) => (
                <Paper key={index} sx={{ p: 2, mb: index < course.teachers!.length - 1 ? 2 : 0 }}>
                  <Typography variant="body1">
                    {teacher.name}
                  </Typography>
                </Paper>
              ))
            ) : !course.teacherName && (
              <Typography variant="body2" color="text.secondary">
                Ei opettajatietoja saatavilla
              </Typography>
            )}
          </Box>
          
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {isDevelopment && (
            <BlocksDebugView blocks={course.contentBlocks} />
          )}
          
          {course.contentBlocks && course.contentBlocks.length > 0 ? (
            <>
              <StudentBlockListNew blocks={course.contentBlocks} courseId={courseId || ''} />
              {isDevelopment && course.contentBlocks && (
                <BlockDebugger blocks={course.contentBlocks} title="Course Content Blocks" />
              )}
            </>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Tällä kurssilla ei ole vielä sisältöä.
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {materials && materials.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {materials.map((material) => (
                <Paper 
                  key={material.id} 
                  variant="outlined" 
                  sx={{ p: 2 }}
                >
                  <Typography variant="h6">
                    {material.title}
                  </Typography>
                  {material.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {material.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Lisätty: {formatDate(material.createdAt)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => handleDownloadMaterial(material.id, material.fileName || material.title)}
                    >
                      Lataa
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              Kurssilla ei ole vielä materiaaleja.
            </Alert>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {assignments && assignments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assignments.map((assignment) => (
                <Paper 
                  key={assignment.id} 
                  variant="outlined" 
                  sx={{ p: 2 }}
                >
                  <Typography variant="h6">
                    {assignment.title}
                  </Typography>
                  {assignment.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {assignment.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {assignment.dueDate && (
                      <Chip 
                        label={`Deadline: ${formatDate(assignment.dueDate)}`}
                        size="small"
                        color={new Date(assignment.dueDate) < new Date() ? "error" : "primary"}
                        variant="outlined"
                      />
                    )}
                    {assignment.status && (
                      <Chip 
                        label={assignment.status === 'submitted' ? 'Palautettu' : 'Ei palautettu'}
                        size="small"
                        color={assignment.status === 'submitted' ? "success" : "default"}
                      />
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleOpenAssignment(assignment.id)}
                  >
                    Avaa tehtävä
                  </Button>
                </Paper>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              Kurssilla ei ole vielä tehtäviä.
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StudentCourseView; 