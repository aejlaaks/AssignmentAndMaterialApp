import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { groupService } from '../../services/courses/groupService';

const groupSchema = yup.object({
  name: yup.string().required('Group name is required'),
  description: yup.string(),
}).required();

interface GroupFormProps {
  courseId: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ courseId, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(groupSchema)
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const groupData = {
        name: data.name,
        description: data.description || `Group for ${data.name}`,
        courseId: courseId
      };
      
      console.log('Creating group with data:', groupData);
      
      onSuccess(groupData);
    } catch (err) {
      console.error('Error in group form submission:', err);
      setError('Failed to submit group data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="div" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add New Group
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box component="div" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          margin="normal"
          fullWidth
          label="Group Name"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          disabled={isSubmitting}
        />
        
        <TextField
          margin="normal"
          fullWidth
          label="Description (optional)"
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
          disabled={isSubmitting}
          multiline
          rows={2}
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default GroupForm;
