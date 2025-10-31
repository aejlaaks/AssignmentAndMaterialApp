import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import Courses from './Courses';
import { StudentCourseList } from '../components/student';

const StudentCoursesPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  if (isLoading) {
    return null; // Or a loading spinner
  }
  
  // Render different components based on user role
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {user?.role === UserRole.Student ? (
        <StudentCourseList />
      ) : (
        <Courses />
      )}
    </Container>
  );
};

export default StudentCoursesPage; 