import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import {
  Grade as GradeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import courseGradingService, { CourseGrade, GradingType } from '../../services/courses/courseGradingService';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';

interface StudentCourseGradeProps {
  courseId: number;
  studentId: string;
}

export const StudentCourseGrade: React.FC<StudentCourseGradeProps> = ({ courseId, studentId }) => {
  const [courseGrade, setCourseGrade] = useState<CourseGrade | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourseGrade = async () => {
      try {
        setLoading(true);
        const grade = await courseGradingService.getStudentCourseGrade(courseId, studentId);
        setCourseGrade(grade);
      } catch (err: any) {
        setError(err.message || 'Error fetching course grade');
        console.error('Error fetching course grade:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseGrade();
  }, [courseId, studentId]);

  // Renders the grade avatar based on grading type
  const renderGradeAvatar = () => {
    if (!courseGrade) return null;

    if (courseGrade.gradingType === GradingType.PassFail) {
      return courseGrade.passed ? (
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: 'success.main',
            fontSize: '1.5rem'
          }}
        >
          <CheckIcon sx={{ fontSize: 40 }} />
        </Avatar>
      ) : (
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: 'error.main',
            fontSize: '1.5rem'
          }}
        >
          <CloseIcon sx={{ fontSize: 40 }} />
        </Avatar>
      );
    } else {
      return (
        <Avatar
          sx={{
            width: 80,
            height: 80,
            fontSize: '2rem',
            bgcolor: 'primary.main'
          }}
        >
          {courseGrade.grade.toFixed(1)}
        </Avatar>
      );
    }
  };

  // Gets the grade text
  const getGradeText = () => {
    if (!courseGrade) return '';
    
    return courseGrade.gradingType === GradingType.PassFail
      ? courseGrade.passed ? 'Pass' : 'Fail'
      : `Grade: ${courseGrade.grade.toFixed(1)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!courseGrade) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="h6">Course Grade</Typography>
          </Box>
          <Typography color="text.secondary">
            No final grade has been assigned for this course yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GradeIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Course Grade</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={courseGrade.gradingType === GradingType.PassFail ? 'Pass/Fail' : 'Scale 1-5'}
            color="secondary"
            size="small"
            sx={{ mr: 1 }}
          />
          {courseGrade.isFinal && (
            <Chip 
              label="Final" 
              color="primary" 
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
          {renderGradeAvatar()}
          <Typography variant="h6" sx={{ mt: 2 }}>
            {getGradeText()}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Graded by: 
            </Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {courseGrade.gradedByName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Date: 
            </Typography>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {formatDate(courseGrade.gradedAt)}
            </Typography>
          </Box>
        </Box>

        {courseGrade.feedback && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">Feedback</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {courseGrade.feedback}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 