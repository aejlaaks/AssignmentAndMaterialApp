import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { courseService } from '../../../services/courses/courseService';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';

interface CourseTeachersViewPanelProps {
  courseId: string;
  mainTeacherId: string;
}

// Interface for teacher display
interface TeacherWithRole {
  id: string;
  name: string;
  email: string;
  isMainTeacher: boolean;
}

const CourseTeachersViewPanel: React.FC<CourseTeachersViewPanelProps> = ({ 
  courseId, 
  mainTeacherId
}) => {
  const [teachers, setTeachers] = useState<TeacherWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { user } = useAuth();
  const isStudent = user?.role === UserRole.Student;

  // Fetch course teachers
  const fetchTeachers = async () => {
    // If the user is a student, we don't try to fetch teachers as they don't have permission
    if (isStudent) {
      console.log('Student user detected, skipping teacher fetch');
      return;
    }
    
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    
    try {
      console.log(`Attempting to fetch teachers for course ${courseId}`);
      const courseTeachers = await courseService.getCourseTeachers(courseId);
      
      if (Array.isArray(courseTeachers) && courseTeachers.length > 0) {
        console.log(`Retrieved ${courseTeachers.length} teachers for course ${courseId}`);
        
        // Map to TeacherWithRole format
        const formattedTeachers: TeacherWithRole[] = courseTeachers.map((teacher: any) => ({
          id: teacher.id,
          name: teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.email,
          email: teacher.email,
          isMainTeacher: teacher.id === mainTeacherId
        }));
        
        setTeachers(formattedTeachers);
      } else {
        console.log('Teacher list is empty or not an array. This might be a permission issue.');
        // We got a response but no teachers - could be permission issue or empty list
        setTeachers([]);
      }
    } catch (err: any) {
      console.error('Error fetching course teachers:', err);
      
      // Check for permission error based on status or message content
      const isPermissionError = 
        (err.response && err.response.status === 403) || 
        (err.message && (err.message.includes('403') || err.message.toLowerCase().includes('forbidden')));
      
      if (isPermissionError) {
        console.warn('Permission denied to access teacher list');
        setPermissionDenied(true);
      } else {
        setError('Opettajien lataaminen epäonnistui');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchTeachers();
  }, [courseId, mainTeacherId]);

  // For students or users with permission denied, render a simplified view
  if (isStudent || permissionDenied) {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Kurssin opettajat</Typography>
        <Typography variant="body2" color="text.secondary">
          Pääopettajan tiedot näytetään kurssin perustiedoissa.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Kurssin opettajat</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      ) : teachers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Ei opettajia
        </Typography>
      ) : (
        <List>
          {teachers.map((teacher) => (
            <React.Fragment key={teacher.id}>
              <ListItem>
                <ListItemText 
                  primary={teacher.name} 
                  secondary={
                    <>
                      {teacher.email}
                      {teacher.isMainTeacher && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="primary"
                          sx={{ display: 'block' }}
                        >
                          Kurssin pääopettaja
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default CourseTeachersViewPanel; 