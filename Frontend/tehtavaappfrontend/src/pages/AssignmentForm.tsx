import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import MaterialSelector from '../components/materials/MaterialSelector';
import { PageHeader } from '../components/ui/PageHeader';
import { useCourses } from '../hooks/useCourses';
import { useAssignments } from '../hooks/useAssignments';
import { useAuth } from '../hooks/useAuth';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { IAssignment } from '../services/assignments/assignmentService';
import { UserRole } from '../types';
import MarkdownEditor from '../components/common/MarkdownEditor';
import { HelpOutline } from '@mui/icons-material';
import { Assignment } from '../types/assignment';

// Define an interface that merges Assignment with relatedMaterials
interface AssignmentWithMaterials extends Assignment {
  contentMarkdown?: string;
  status?: string;
  relatedMaterials?: Array<{ id: string }>;
}

const AssignmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();
  
  // Redirect students to dashboard
  if (user?.role === UserRole.Student) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  
  // Courses
  const { courses, isLoading: coursesLoading, error: coursesError, getCourses } = useCourses();
  
  // Assignments
  const { 
    createAssignment, 
    updateAssignment,
    getAssignmentById,
    isLoading: assignmentLoading, 
    error: assignmentError 
  } = useAssignments();
  
  useEffect(() => {
    getCourses();
    
    // If in edit mode, fetch the assignment
    if (isEditMode && id) {
      const fetchAssignment = async () => {
        const data = await getAssignmentById(id);
        if (data) {
          // Type cast data to AssignmentWithMaterials to handle relatedMaterials
          const assignmentWithMaterials = data as AssignmentWithMaterials;
          
          // Create an IAssignment object from the data
          const assignmentData: IAssignment = {
            id: assignmentWithMaterials.id,
            title: assignmentWithMaterials.title,
            description: assignmentWithMaterials.description || '',
            contentMarkdown: assignmentWithMaterials.contentMarkdown || '',
            courseId: assignmentWithMaterials.courseId || '',
            dueDate: assignmentWithMaterials.dueDate || '',
            points: assignmentWithMaterials.points,
            status: assignmentWithMaterials.status
          };
          
          // Update state with properly typed data
          setAssignment(assignmentData);
          setSelectedCourseId(assignmentData.courseId);
          setMarkdownContent(assignmentData.contentMarkdown || '');
          
          // Set selected materials if available
          if (assignmentWithMaterials.relatedMaterials && assignmentWithMaterials.relatedMaterials.length > 0) {
            setSelectedMaterialIds(assignmentWithMaterials.relatedMaterials.map((material) => material.id));
          }
        }
      };
      
      fetchAssignment();
    }
  }, [getCourses, getAssignmentById, id, isEditMode]);
  
  const handleCourseChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCourseId(event.target.value as string);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const assignmentData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        contentMarkdown: markdownContent,
        courseId: formData.get('courseId') as string,
        dueDate: formData.get('dueDate') as string,
        points: parseInt(formData.get('points') as string, 10),
        materialIds: selectedMaterialIds, // Add selected materials
      };
      
      let success = false;
      
      if (isEditMode && id) {
        console.log('Updating assignment:', { id, ...assignmentData });
        success = await updateAssignment({ 
          id, 
          ...assignmentData,
          status: assignment?.status || 'Published'
        });
        
        if (success) {
          setSnackbarMessage('Assignment updated successfully');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage('Failed to update assignment');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } else {
        console.log('Creating assignment:', assignmentData);
        success = await createAssignment(assignmentData);
        
        if (success) {
          setSnackbarMessage('Assignment created successfully');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          setSnackbarMessage('Failed to create assignment');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      }
      
      if (success) {
        // Navigate back to assignments page after a short delay
        setTimeout(() => {
          navigate('/assignments');
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbarMessage('An error occurred while submitting the form');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const isLoading = coursesLoading || assignmentLoading;
  const error = coursesError || assignmentError;
  
  // Format date for datetime-local input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Box>
      <PageHeader
        title={isEditMode ? "Edit Assignment" : "Create Assignment"}
        showBackButton={true}
      />
      
      {isLoading && !assignment ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Assignment Title"
                  fullWidth
                  required
                  defaultValue={assignment?.title || ''}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  defaultValue={assignment?.description || ''}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 2 }}>
                    Tehtävän sisältö (markdown)
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => navigate('/assignments/help')}
                    startIcon={<HelpOutline />}
                  >
                    Muotoiluohjeet
                  </Button>
                </Box>
                <MarkdownEditor
                  value={markdownContent}
                  onChange={setMarkdownContent}
                  courseId={selectedCourseId}
                  label=""
                  placeholder="Kirjoita tehtävän sisältö markdown-muodossa..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="course-label">Course</InputLabel>
                  <Select
                    labelId="course-label"
                    name="courseId"
                    label="Course"
                    value={selectedCourseId || (assignment?.courseId || '')}
                    onChange={(e) => setSelectedCourseId(e.target.value as string)}
                  >
                    {Array.isArray(courses) ? courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.name}
                      </MenuItem>
                    )) : []}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="points"
                  label="Points"
                  type="number"
                  fullWidth
                  required
                  defaultValue={assignment?.points || 100}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="dueDate"
                  label="Due Date"
                  type="datetime-local"
                  fullWidth
                  required
                  defaultValue={
                    assignment?.dueDate 
                      ? formatDateForInput(assignment.dueDate)
                      : formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Related Materials
                </Typography>
                {selectedCourseId ? (
                  <MaterialSelector
                    courseId={selectedCourseId}
                    selectedMaterialIds={selectedMaterialIds}
                    onChange={setSelectedMaterialIds}
                    disabled={isLoading}
                  />
                ) : (
                  <Typography color="textSecondary" variant="body2">
                    Please select a course first to see available materials
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/assignments')}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? (isEditMode ? 'Updating...' : 'Creating...') 
                      : (isEditMode ? 'Update Assignment' : 'Create Assignment')
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentForm;
