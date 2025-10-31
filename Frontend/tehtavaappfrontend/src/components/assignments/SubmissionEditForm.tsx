import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Snackbar
} from '@mui/material';
import { ISubmission, ISubmissionUpdate, updateSubmission } from '../../services/assignments/submissionService';

interface SubmissionEditFormProps {
  submission: ISubmission;
  onUpdateComplete?: (updatedSubmission: ISubmission) => void;
}

const SubmissionEditForm: React.FC<SubmissionEditFormProps> = ({
  submission,
  onUpdateComplete
}) => {
  const [content, setContent] = useState<string>(submission.submissionText || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Päivitetään sisältö, jos submission vaihtuu
    setContent(submission.submissionText || '');
  }, [submission]);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Palautuksen sisältö ei voi olla tyhjä');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure ID is properly formatted for the backend - safely handle the id regardless of its type
      const submissionId = submission.id;
      
      const updateData: ISubmissionUpdate = {
        id: submissionId,
        content: content
      };
      
      console.log('Sending submission update:', updateData);
      const updatedSubmission = await updateSubmission(updateData);
      
      setSuccess(true);
      setIsSubmitting(false);
      
      if (onUpdateComplete) {
        onUpdateComplete(updatedSubmission);
      }
    } catch (err) {
      console.error('Virhe palautuksen päivityksessä:', err);
      setError('Palautuksen päivittäminen epäonnistui. Yritä uudelleen.');
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  // Estetään muokkaus, jos palautus on jo arvioitu ja ei vaadi korjausta
  const isDisabled = submission.status === 'graded' && !submission.requiresRevision;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Muokkaa palautusta
      </Typography>
      
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Tehtävä: {submission.assignmentTitle || `Tehtävä ${submission.assignmentId}`}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Palautettu: {new Date(submission.submittedAt).toLocaleString('fi-FI')}
          {submission.isLate && (
            <Typography component="span" color="error" sx={{ ml: 1 }}>
              (Myöhässä)
            </Typography>
          )}
        </Typography>
      </Box>
      
      {submission.requiresRevision && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Tämä palautus vaatii korjauksia. Tee tarvittavat muutokset ja lähetä uudelleen.
        </Alert>
      )}
      
      {isDisabled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tätä palautusta ei voi enää muokata, koska se on jo arvioitu.
        </Alert>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Palautuksen sisältö"
              fullWidth
              multiline
              rows={10}
              value={content}
              onChange={handleContentChange}
              disabled={isDisabled || isSubmitting}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isDisabled || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Tallennetaan...' : 'Tallenna muutokset'}
            </Button>
          </Grid>
        </Grid>
      </form>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Palautus päivitetty onnistuneesti!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SubmissionEditForm; 