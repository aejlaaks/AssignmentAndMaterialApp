import { type FC, useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Box, Button, TextField, Divider, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useCourses } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courses/courseService';
import CourseCanvas from '../components/courses/CourseCanvas';
import { Block } from '../types/blocks';
import { UserRole } from '../types';
import { BlockDebugger } from '../components/blocks/BlockDebugger';

const CourseForm: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createCourse, updateCourse, isLoading, error } = useCourses();
  const { user } = useAuth();
  
  // Redirect students to dashboard
  if (user?.role === UserRole.Student) {
    return <Navigate to="/dashboard" replace />;
  }
  const [course, setCourse] = useState<{ name: string; description: string; contentBlocks?: Block[]; TeacherId?: string; code?: string }>({
    name: '',
    description: '',
    contentBlocks: [],
    TeacherId: user?.id,
    code: ''
  });
  const [contentBlocks, setContentBlocks] = useState<Block[]>([]);
  const [fetchingCourse, setFetchingCourse] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const isEditMode = !!id;
  
  // Load form state from localStorage on initial render
  useEffect(() => {
    if (!isEditMode) {
      try {
        const savedForm = localStorage.getItem('courseFormDraft');
        if (savedForm) {
          const formData = JSON.parse(savedForm);
          setCourse(prev => ({
            ...prev,
            name: formData.name || '',
            description: formData.description || '',
            code: formData.code || '',
            TeacherId: formData.TeacherId || user?.id
          }));
        }
      } catch (err) {
        console.error('Error loading form draft from localStorage:', err);
      }
    }
  }, [isEditMode, user?.id]);
  
  // Save form state to localStorage whenever it changes
  useEffect(() => {
    if (!isEditMode) {
      const formDraft = {
        name: course.name,
        description: course.description,
        code: course.code,
        TeacherId: course.TeacherId
      };
      localStorage.setItem('courseFormDraft', JSON.stringify(formDraft));
    }
  }, [course.name, course.description, course.code, course.TeacherId, isEditMode]);
  
  // Clear localStorage when form is submitted successfully
  const clearFormDraft = () => {
    localStorage.removeItem('courseFormDraft');
  };

  // Fetch teachers for dropdown selection
  useEffect(() => {
    const fetchTeachers = async () => {
      if (user?.role === UserRole.Admin) {
        try {
          setLoadingTeachers(true);
          // You'd need a service method to fetch all teachers
          // This is a placeholder - implement the actual API call
          const response = await fetch(`${import.meta.env.VITE_API_URL}/user/teachers`);
          if (response.ok) {
            const data = await response.json();
            setTeachers(data);
          } else {
            console.error('Failed to fetch teachers');
            // Set current user as the only teacher option if API fails
            setTeachers(user ? [user] : []);
          }
        } catch (error) {
          console.error('Error fetching teachers:', error);
          // Set current user as the only teacher option if API fails
          setTeachers(user ? [user] : []);
        } finally {
          setLoadingTeachers(false);
        }
      } else {
        // For non-admin users, they can only assign themselves as teacher
        setTeachers(user ? [user] : []);
      }
    };

    fetchTeachers();
  }, [user]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (id) {
        try {
          setFetchingCourse(true);
          const courseData = await courseService.getCourseById(id);
          
          // Log the entire response to debug
          console.log('Course data received from API:', courseData);
          
          // Extract content blocks if they exist
          const contentBlocks = courseData.contentBlocks || [];
          
          // Check for code field with different cases or use name as fallback
          const courseCode = courseData.code || courseData.Code || courseData.name || '';
          console.log('Course code detected:', courseCode);
          
          setCourse({
            name: courseData.name,
            description: courseData.description,
            contentBlocks: contentBlocks,
            TeacherId: courseData.teacherId || user?.id,
            code: courseCode
          });
          
          // Update the content blocks state
          setContentBlocks(contentBlocks);
          
        } catch (err) {
          console.error('Error fetching course:', err);
          setFetchError('Kurssin tietojen hakeminen epäonnistui');
        } finally {
          setFetchingCourse(false);
        }
      }
    };

    fetchCourse();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get code and ensure it's not empty
    const codeValue = formData.get('code');
    const courseCode = codeValue ? String(codeValue).trim() : '';
    
    if (!courseCode) {
      setFetchError('Kurssikoodi on pakollinen');
      return;
    }

    const courseData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      contentBlocks: contentBlocks,
      TeacherId: (formData.get('TeacherId') as string) || user?.id,
      code: courseCode,
      Code: courseCode  // Add uppercase version too
    };
    
    // Log the course data being submitted
    console.log('Submitting course data:', courseData);
    console.log('Content blocks being submitted:', contentBlocks);
    console.log('Teacher ID being submitted:', courseData.TeacherId);
    console.log('Course code being submitted (lowercase):', courseData.code);
    console.log('Course code being submitted (uppercase):', courseData.Code);
    
    // Final validation
    if (!courseData.code || courseData.code.trim() === '') {
      console.error('Course code is missing after validation');
      setFetchError('Kurssikoodi on pakollinen - tarkista kenttä');
      return;
    }

    if (!courseData.name || courseData.name.trim() === '') {
      console.error('Course name is missing');
      setFetchError('Kurssin nimi on pakollinen');
      return;
    }

    // Validate that we have content blocks
    if (!Array.isArray(courseData.contentBlocks)) {
      console.error('Content blocks is not an array:', courseData.contentBlocks);
      courseData.contentBlocks = [];
    }
    
    // Validate that we have a TeacherId
    if (!courseData.TeacherId) {
      console.error('TeacherId is missing');
      setFetchError('Opettajan ID on pakollinen');
      return;
    }
    
    let success;
    if (isEditMode && id) {
      success = await updateCourse(id, courseData);
      // Stay on the edit page after successful update
      if (success) {
        setSuccessMessage('Kurssi päivitetty onnistuneesti');
        // No need to clear form draft in edit mode
      }
    } else {
      success = await createCourse(courseData);
      // Only navigate away after creating a new course
      if (success) {
        clearFormDraft(); // Clear the draft on successful submission
        navigate('/courses');
      }
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  const handleContentBlocksChange = (blocks: Block[]) => {
    console.log('Content blocks changed:', blocks);
    // Ensure we're working with a valid array
    const validBlocks = Array.isArray(blocks) ? blocks : [];
    
    setContentBlocks([...validBlocks]); // Create a new array to ensure state update
    
    // Also update the course state to keep it in sync
    setCourse(prev => ({
      ...prev,
      contentBlocks: [...validBlocks]
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherChange = (e: SelectChangeEvent<string>) => {
    setCourse(prev => ({ ...prev, TeacherId: e.target.value }));
  };

  // Add a forced value validation and update for the code field
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    // Force update the course state
    setCourse(prev => ({ 
      ...prev, 
      code: value,
      Code: value  // Keep both versions in sync
    }));
  };

  if (isLoading || fetchingCourse) return <LoadingSpinner />;
  if (error || fetchError) return <ErrorAlert message={error || fetchError || 'Tapahtui virhe'} />;

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <PageHeader title={isEditMode ? "Muokkaa kurssia" : "Luo uusi kurssi"} showBackButton />
      
      {isDevelopment && (
        <BlockDebugger 
          blocks={contentBlocks} 
          title={`Content Blocks (${isEditMode ? 'Edit' : 'Create'} Mode)`} 
        />
      )}
      
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          mt: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <TextField
          name="name"
          label="Kurssin nimi"
          variant="outlined"
          fullWidth
          required
          value={course.name}
          onChange={handleInputChange}
        />
        <TextField
          name="code"
          label="Kurssikoodi"
          variant="outlined"
          fullWidth
          required
          value={course.code || ''}
          onChange={handleCodeChange}
          helperText="Pakollinen kenttä - esim. ABC123"
          error={!course.code}
          inputProps={{
            maxLength: 50,
            minLength: 1
          }}
        />
        <TextField
          name="description"
          label="Kuvaus"
          variant="outlined"
          fullWidth
          required
          multiline
          rows={4}
          value={course.description}
          onChange={handleInputChange}
        />
        
        <FormControl fullWidth variant="outlined">
          <InputLabel id="teacher-select-label">Opettaja</InputLabel>
          <Select
            labelId="teacher-select-label"
            id="TeacherId"
            name="TeacherId"
            value={course.TeacherId || ''}
            onChange={handleTeacherChange}
            label="Opettaja"
            disabled={loadingTeachers || user?.role !== UserRole.Admin}
            required
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.firstName} {teacher.lastName} ({teacher.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Divider sx={{ my: 3 }} />
        
        <CourseCanvas 
          courseId={id || 'new'}
          initialBlocks={course.contentBlocks || []}
          onBlocksChange={handleContentBlocksChange}
        />
        
        <Box 
          sx={{ 
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
            padding: 2,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            mt: 3,
            zIndex: 10,
            boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Peruuta
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
          >
            {isLoading 
              ? (isEditMode ? 'Päivitetään...' : 'Luodaan...') 
              : (isEditMode ? 'Päivitä kurssi' : 'Luo kurssi')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CourseForm;
