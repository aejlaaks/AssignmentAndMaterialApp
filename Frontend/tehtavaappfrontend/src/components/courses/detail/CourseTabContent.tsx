import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useCourseManagement } from '../../../hooks/useCourseManagement';
import { Course } from '../../../interfaces/models/Course';
import { UpdateCourseRequest } from '../../../interfaces/services/ICourseService';

interface CourseTabContentProps {
  courseId: string;
  canManage: boolean;
}

/**
 * Course Tab Content Component
 * 
 * This component is responsible for displaying and editing course details.
 * It follows the Single Responsibility Principle by focusing only on course-related operations.
 */
const CourseTabContent: React.FC<CourseTabContentProps> = ({
  courseId,
  canManage
}) => {
  // State for notification messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [courseData, setCourseData] = useState<Course | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UpdateCourseRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    code: undefined
  });
  
  // Use our specialized hook for course management
  const { 
    fetchCourseById,
    updateCourse,
    isLoading,
    error,
    resetError
  } = useCourseManagement();
  
  // Fetch course data on component mount
  useEffect(() => {
    const loadCourse = async () => {
      if (courseId) {
        const course = await fetchCourseById(courseId);
        if (course) {
          setCourseData(course);
          // Initialize form data with course values
          setFormData({
            name: course.name,
            description: course.description || '',
            startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
            endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
            isActive: course.isActive || false,
            code: course.code
          });
        }
      }
    };
    
    loadCourse();
  }, [courseId, fetchCourseById]);
  
  // Handler for showing notifications
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handler for form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler for switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handler for saving course changes
  const handleSaveCourse = async () => {
    if (!courseId) {
      showNotification('Course ID is missing', 'error');
      return;
    }
    
    const result = await updateCourse(courseId, formData);
    
    if (result) {
      showNotification('Course updated successfully', 'success');
      setCourseData(result);
      setIsEditMode(false);
    } else {
      showNotification('Failed to update course', 'error');
    }
  };
  
  // Handler for canceling edit mode
  const handleCancelEdit = () => {
    // Reset form data to original course values
    if (courseData) {
      setFormData({
        name: courseData.name,
        description: courseData.description || '',
        startDate: courseData.startDate ? new Date(courseData.startDate).toISOString().split('T')[0] : '',
        endDate: courseData.endDate ? new Date(courseData.endDate).toISOString().split('T')[0] : '',
        isActive: courseData.isActive || false,
        code: courseData.code
      });
    }
    setIsEditMode(false);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" align="center">Loading course details...</Typography>
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={resetError}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }
  
  // Render if no course data is available
  if (!courseData) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" align="center">No course data available</Typography>
      </Paper>
    );
  }
  
  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {isEditMode ? (
          // Edit Mode
          <Box component="form" noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" mb={2}>Edit Course Details</Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Course Code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Course is active"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveCourse}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // View Mode
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Course Details</Typography>
              {canManage && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditMode(true)}
                >
                  Edit Course
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">Name</Typography>
                <Typography variant="body1">{courseData.name}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">Code</Typography>
                <Typography variant="body1">{courseData.code || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary">Description</Typography>
                <Typography variant="body1">{courseData.description || 'No description available'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">Start Date</Typography>
                <Typography variant="body1">
                  {courseData.startDate ? new Date(courseData.startDate).toLocaleDateString() : 'Not set'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="textSecondary">End Date</Typography>
                <Typography variant="body1">
                  {courseData.endDate ? new Date(courseData.endDate).toLocaleDateString() : 'Not set'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary">Status</Typography>
                <Typography variant="body1">
                  {courseData.isActive ? 'Active' : 'Inactive'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={5000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CourseTabContent; 