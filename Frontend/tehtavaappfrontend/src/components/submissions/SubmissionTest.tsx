import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, CircularProgress } from '@mui/material';
import { submissionService } from '../../services/submission';

const SubmissionTest: React.FC = () => {
  const [assignmentId, setAssignmentId] = useState('33');
  const [content, setContent] = useState('Test submission content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    
    try {
      // Test direct API call
      const submission = await submissionService.createSubmission({
        assignmentId,
        content
      });
      
      setResult(submission);
      console.log('Submission created successfully:', submission);
    } catch (err) {
      console.error('Error creating submission:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 3 }}>
      <Typography variant="h5" gutterBottom>
        Submission Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Assignment ID"
          value={assignmentId}
          onChange={(e) => setAssignmentId(e.target.value)}
          fullWidth
          margin="normal"
        />
        
        <TextField
          label="Submission Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
      </Box>
      
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
      >
        {isSubmitting ? 'Submitting...' : 'Test Submission'}
      </Button>
      
      {error && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error.dark">{error}</Typography>
        </Box>
      )}
      
      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Result:</Typography>
          <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default SubmissionTest; 