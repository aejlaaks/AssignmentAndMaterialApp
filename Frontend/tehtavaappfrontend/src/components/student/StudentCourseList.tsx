import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { courseService } from '../../services/courses/courseService';
import { formatDate } from '../../utils/dateUtils';
import { Course } from '../../types/CourseTypes';
import { useAuth } from '../../hooks/useAuth';

const StudentCourseList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch enrolled courses for students instead of all available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await courseService.getEnrolledCourses();
        setCourses(data);
        setFilteredCourses(data);
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        setError('Kurssien hakeminen epäonnistui. Yritä uudelleen.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Filter courses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = courses.filter(course => 
      course.title.toLowerCase().includes(query) || 
      (course.description && course.description.toLowerCase().includes(query))
    );
    
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCourseClick = (courseId: string) => {
    console.log(`Navigating to student course view for course ID: ${courseId}`, {
      targetPath: `/student-courses/${courseId}`,
      courseId: courseId
    });
    
    const targetPath = `/student-courses/${courseId}`;
    navigate(targetPath);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Kurssit
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selaa saatavilla olevia kursseja ja ilmoittaudu niihin.
        </Typography>
      </Box>
      
      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Etsi kursseja..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
      </Paper>
      
      {filteredCourses.length === 0 ? (
        <Alert severity="info">
          {searchQuery ? 'Hakuehdoilla ei löytynyt kursseja.' : 'Ei saatavilla olevia kursseja.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map(course => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleCourseClick(course.id)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <SchoolIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" noWrap>
                      {course.title}
                    </Typography>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {course.description || 'Ei kuvausta'}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {course.startDate && (
                        <Chip
                          icon={<CalendarIcon />}
                          label={`Alkaa: ${formatDate(course.startDate)}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {course.endDate && (
                        <Chip
                          icon={<CalendarIcon />}
                          label={`Päättyy: ${formatDate(course.endDate)}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StudentCourseList; 