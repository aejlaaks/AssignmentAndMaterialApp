import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress
} from '@mui/material';
import { submissionService } from '../../services/assignments/submissionService';
import { assignmentService } from '../../services/assignments/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import { SubmissionCreator } from './submission';

interface SubmissionFormProps {
  assignmentId: string;
  onSubmissionComplete?: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ assignmentId, onSubmissionComplete }) => {
  const [existingSubmission, setExistingSubmission] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Check if student already has a submission for this assignment
    const checkExistingSubmission = async () => {
      if (!assignmentId || !user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const submissions = await submissionService.getSubmissionsByAssignment(assignmentId);
        const userSubmission = submissions.find(sub => sub.studentId === user.id);
        
        if (userSubmission) {
          setExistingSubmission(userSubmission);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Virhe palautusten tarkistuksessa:', err);
        setError('Palautusten tarkistaminen epäonnistui. Yritä uudelleen.');
        setLoading(false);
      }
    };
    
    checkExistingSubmission();
  }, [assignmentId, user]);

  const handleSubmissionComplete = (submissionId: string) => {
    if (onSubmissionComplete) {
      onSubmissionComplete();
    }
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
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (existingSubmission) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Olet jo palauttanut tämän tehtävän
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Olet jo palauttanut tämän tehtävän. Voit tarkastella palautustasi palautussivulla.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Palautettu: {new Date(existingSubmission.submittedAt).toLocaleString('fi-FI')}
        </Typography>
      </Paper>
    );
  }

  return (
    <SubmissionCreator 
      assignmentId={assignmentId}
      onSubmissionComplete={handleSubmissionComplete}
    />
  );
};

export default SubmissionForm; 