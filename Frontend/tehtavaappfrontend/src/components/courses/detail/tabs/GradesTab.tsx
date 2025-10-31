import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Tabs, 
  Tab, 
  Divider 
} from '@mui/material';
import { groupService, IStudent } from '../../../../services/courses/groupService';
import { CourseGradesTable } from '../../../courses/CourseGradesTable';
import { CourseGradeStats } from '../../../courses/CourseGradeStats';
import courseGradingService, { CourseGrade } from '../../../../services/courses/courseGradingService';

interface GradesTabProps {
  courseId: number | string;
  isOwner: boolean;
}

/**
 * Tab for managing and viewing course grades
 */
const GradesTab: React.FC<GradesTabProps> = ({ courseId, isOwner }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Array<{ id: string, name: string }>>([]);
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Debug auth token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log('GradesTab - Auth token exists:', !!token);
    if (token) {
      console.log('Token first 20 chars:', token.substring(0, 20) + '...');
    }
  }, []);

  // Ensure courseId is a number for the API calls
  const numericCourseId = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;

  // Fetch students and grades data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students in the course
        const courseGroups = await groupService.getGroupsByCourse(numericCourseId.toString());
        let allStudents: Array<{ id: string, name: string }> = [];
        
        for (const group of courseGroups) {
          const groupDetails = await groupService.getGroupById(group.id.toString());
          if (groupDetails && groupDetails.students) {
            const studentList = groupDetails.students.map((student: IStudent) => ({
              id: student.id,
              name: `${student.firstName || ''} ${student.lastName || ''}`
            }));
            
            allStudents = [...allStudents, ...studentList];
          }
        }
        
        // Remove duplicates (students may be in multiple groups)
        allStudents = allStudents.filter((student, index, self) => 
          index === self.findIndex(s => s.id === student.id)
        );
        
        setStudents(allStudents);
        
        // Fetch grades
        const gradesData = await courseGradingService.getCourseGrades(numericCourseId);
        setGrades(gradesData);
        
        setError(null);
      } catch (err: any) {
        console.error('Error loading course grade data:', err);
        setError('Failed to load course grade data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [numericCourseId]);

  // Handle grade refresh
  const handleGradeUpdated = async () => {
    try {
      const gradesData = await courseGradingService.getCourseGrades(numericCourseId);
      setGrades(gradesData);
    } catch (err) {
      console.error('Error refreshing grades:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Student Grades" />
          <Tab label="Grade Statistics" />
        </Tabs>

        <Box p={3}>
          {tabValue === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Course Grades
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage student grades for the course. You can assign numeric grades (1-5) or Pass/Fail grades.
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <CourseGradesTable 
                courseId={numericCourseId}
                students={students}
                onGradeUpdated={handleGradeUpdated}
              />
            </>
          )}

          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Grade Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Overview of grade distribution and statistics for the course.
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <CourseGradeStats 
                grades={grades}
                totalStudents={students.length}
              />
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default GradesTab; 