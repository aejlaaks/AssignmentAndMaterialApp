import { type FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useCourses } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

const Courses: FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, error, getCourses } = useCourses();
  const { user } = useAuth(); // Lisätään käyttäjän tietojen haku
  const isStudent = user?.role === UserRole.Student; // Tarkistetaan, onko käyttäjä opiskelija

  useEffect(() => {
    getCourses();
  }, [getCourses]); // Fetch courses on mount

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Box>
      <PageHeader 
        title="Kurssit" 
        action={!isStudent ? {
          label: "Luo kurssi",
          onClick: () => navigate('/courses/create')
        } : undefined}
      />
      
      {courses.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
          Kursseja ei löytynyt. Luo ensimmäinen kurssisi!
        </Typography>
      ) : (
        <Box sx={{ mt: 3, display: 'grid', gap: 2 }}>
          {courses.map(course => (
            <Box
              key={course.id}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                }
              }}
              onClick={() => navigate(isStudent ? `/student-courses/${course.id}` : `/courses/${course.id}`)}
            >
              <Typography variant="h6">{course.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {course.description}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Courses;
