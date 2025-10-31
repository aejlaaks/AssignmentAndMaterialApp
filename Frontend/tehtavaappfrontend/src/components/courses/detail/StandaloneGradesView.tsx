import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Breadcrumbs,
  Link, 
  CircularProgress
} from '@mui/material';
import { ArrowBack, Grading } from '@mui/icons-material';
import GradesTab from './tabs/GradesTab';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';
import { useCourseStore } from '../../../hooks/useCourseStore';

/**
 * Standalone component to display the Grades tab
 * This can be used for direct access outside the tab structure
 */
const StandaloneGradesView: React.FC = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { fetchCourseById, course, loading } = useCourseStore();
  const [pageLoading, setPageLoading] = useState(true);
  
  // Check permissions using the UserRole enum
  const isTeacher = user?.role === UserRole.Teacher || user?.role === UserRole.Admin;
  
  // Fetch course data
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      if (courseId) {
        await fetchCourseById(courseId);
      }
      setPageLoading(false);
    };
    
    loadData();
  }, [courseId, fetchCourseById]);
  
  // Navigation handler
  const handleBack = () => {
    navigate(`/courses/${courseId}`);
  };
  
  // Debug logs
  console.log('StandaloneGradesView - User:', user);
  console.log('StandaloneGradesView - Is teacher:', isTeacher);
  console.log('StandaloneGradesView - Course ID:', courseId);
  console.log('StandaloneGradesView - Course data:', course);
  
  if (pageLoading || loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!isAuthenticated || !isTeacher) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Ei käyttöoikeutta
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Sinulla ei ole oikeuksia nähdä tätä sivua. Vain opettajat ja ylläpitäjät voivat tarkastella arvosanoja.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/courses')}
          >
            Palaa kurssilistaukseen
          </Button>
        </Paper>
      </Container>
    );
  }
  
  if (!course) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Kurssia ei löydy
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Valittua kurssia ei löytynyt. Tarkista kurssin ID.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/courses')}
          >
            Palaa kurssilistaukseen
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button"
          underline="hover" 
          color="inherit" 
          onClick={() => navigate('/courses')}
        >
          Kurssit
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/courses/${courseId}`)}
        >
          {course.title}
        </Link>
        <Typography color="text.primary">Arvosanat</Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ mb: 1 }}
          >
            Takaisin kurssille
          </Button>
          <Typography variant="h4" component="h1">
            {course.title} - Arvosanat
          </Typography>
        </Box>
      </Box>
      
      {/* Main content */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Grading sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">
            Kurssin arvosanat
          </Typography>
        </Box>
        
        <GradesTab 
          courseId={parseInt(courseId, 10)} 
          isOwner={true} 
        />
      </Paper>
    </Container>
  );
};

export default StandaloneGradesView; 