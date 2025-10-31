import React from 'react';
import { Box, Typography, Paper, Chip, Grid } from '@mui/material';
import { CalendarToday, Person } from '@mui/icons-material';
import { Course } from '../../../../types/CourseTypes';

interface InfoTabProps {
  course: Course;
}

/**
 * Component to display general course information
 */
const InfoTab: React.FC<InfoTabProps> = ({ course }) => {
  // Format date to local format
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Not specified';
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString();
  };

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Course Description
        </Typography>
        <Typography paragraph>
          {course.description || 'No description available.'}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1 }} />
              <Typography>
                <strong>Instructor:</strong> {course.teacherName || 'Not assigned'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarToday sx={{ mr: 1 }} />
              <Typography>
                <strong>Created:</strong> {formatDate(course.createdAt)}
              </Typography>
            </Box>
            
            {course.startDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1 }} />
                <Typography>
                  <strong>Start Date:</strong> {formatDate(course.startDate)}
                </Typography>
              </Box>
            )}
            
            {course.endDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ mr: 1 }} />
                <Typography>
                  <strong>End Date:</strong> {formatDate(course.endDate)}
                </Typography>
              </Box>
            )}
            
            {course.code && (
              <Typography sx={{ mb: 2 }}>
                <strong>Course Code:</strong> {course.code}
              </Typography>
            )}
            
            {course.isActive !== undefined && (
              <Typography>
                <strong>Status:</strong> {course.isActive ? 'Active' : 'Inactive'}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            
            <Typography sx={{ mb: 1 }}>
              <strong>Students:</strong> {course.studentCount || 0}
            </Typography>
            
            <Typography sx={{ mb: 1 }}>
              <strong>Materials:</strong> {course.materialCount || 0}
            </Typography>
            
            <Typography>
              <strong>Assignments:</strong> {course.assignmentCount || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InfoTab; 