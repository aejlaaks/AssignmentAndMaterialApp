import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Container, Paper } from '@mui/material';
import GradesTab from '../components/courses/detail/tabs/GradesTab';
import { useUserStore } from '../hooks/useUserStore';

/**
 * Standalone page to display the Grades tab
 * This can be used for direct access outside the tab structure
 */
const StandaloneGradesView: React.FC = () => {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { user } = useUserStore();
  
  // Check permissions
  const isTeacher = user?.role?.toLowerCase() === 'teacher' || user?.role?.toLowerCase() === 'admin';
  
  console.log('StandaloneGradesView - User:', user);
  console.log('StandaloneGradesView - Is teacher:', isTeacher);
  console.log('StandaloneGradesView - Course ID:', courseId);
  
  if (!isTeacher) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Ei käyttöoikeutta
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Sinulla ei ole oikeuksia nähdä tätä sivua. Vain opettajat ja ylläpitäjät voivat tarkastella arvosanoja.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Kurssin arvosanat
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <GradesTab 
          courseId={parseInt(courseId, 10) || 0} 
          isOwner={true} 
        />
      </Box>
    </Container>
  );
};

export default StandaloneGradesView; 