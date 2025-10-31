import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';
import { courseService } from '../../../services/courses/courseService';
import { Course, CourseRequest, courseMappers } from '../../../types/CourseTypes';

interface CourseEditDialogProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  onUpdateSuccess: (updatedCourse: Course) => void;
}

/**
 * Dialog for editing course details
 */
const CourseEditDialog: React.FC<CourseEditDialogProps> = ({
  open,
  onClose,
  course,
  onUpdateSuccess
}) => {
  const [formData, setFormData] = useState({
    title: course.title || '',
    description: course.description || '',
    code: course.code || '',
    isActive: course.isActive !== false, // default to true if undefined
    startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
    endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Construct update request with the original content blocks
      const updateRequest: CourseRequest = {
        name: formData.title, // Map to 'name' for API
        description: formData.description,
        contentBlocks: course.contentBlocks || [],
        code: formData.code,
        isActive: formData.isActive,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      };

      // Call service to update course
      const apiResponse = await courseService.updateCourse(course.id, updateRequest);
      
      // Map the API response to our UI model
      const updatedCourse = courseMappers.toUiModel(apiResponse);
      
      // Call success callback with updated course
      onUpdateSuccess(updatedCourse);
      
      // Close dialog
      onClose();
    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Course</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Course Title"
            type="text"
            fullWidth
            required
            value={formData.title}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="code"
            label="Course Code"
            type="text"
            fullWidth
            value={formData.code}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            multiline
            rows={4}
            fullWidth
            required
            value={formData.description}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              name="startDate"
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleChange}
              sx={{ flex: 1 }}
            />
            
            <TextField
              margin="dense"
              name="endDate"
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleChange}
              sx={{ flex: 1 }}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleChange}
                name="isActive"
                color="primary"
              />
            }
            label="Course is active"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CourseEditDialog; 