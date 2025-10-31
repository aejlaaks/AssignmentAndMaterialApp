import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { responsiveClasses } from '../../../utils/responsiveUtils';
import { formatCourseDate, hasCourseDate } from '../../../utils/courseUtils';
import { Course } from '../../../types';

interface CourseInfoPanelProps {
  course: Course;
  canManage: boolean;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ course, canManage }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper 
      sx={{ 
        mb: 4,
        p: { xs: 2, sm: 3 },
        borderRadius: 2
      }}
    >
      <Box sx={{ 
        display: 'flex',
        ...responsiveClasses.flexColSm,
        gap: 2
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Kurssin tiedot
          </Typography>
          <Typography variant="body1" paragraph>
            {course.description || 'Ei kuvausta'}
          </Typography>
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}>
            {hasCourseDate(course, 'startDate') && (
              <Chip 
                label={`Alkaa: ${formatCourseDate(course, 'startDate')}`}
                size={isMobile ? "small" : "medium"}
              />
            )}
            {hasCourseDate(course, 'endDate') && (
              <Chip 
                label={`Päättyy: ${formatCourseDate(course, 'endDate')}`}
                size={isMobile ? "small" : "medium"}
              />
            )}
          </Box>
        </Box>
        
        {canManage && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minWidth: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/courses/${course.id}/edit`)}
              fullWidth={isMobile}
            >
              Muokkaa kurssia
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default CourseInfoPanel; 