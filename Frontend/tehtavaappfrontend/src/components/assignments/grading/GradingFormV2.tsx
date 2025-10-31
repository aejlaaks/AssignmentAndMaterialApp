import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fi } from 'date-fns/locale';
import { 
  ISubmission, 
  IGradeSubmission, 
  submissionService, 
  IReturnSubmission 
} from '../../../services/assignments/submissionService';
import { formatDate } from '../../../utils/dateUtils';
import { normalizeStatus } from '../../../utils/submissionUtils';

interface GradingFormProps {
  submission: ISubmission;
  onGradingComplete?: (updatedSubmission: ISubmission) => void;
}

/**
 * Enhanced grading form component with improved organization and error handling
 */
const GradingFormV2: React.FC<GradingFormProps> = ({ submission, onGradingComplete }) => {
  // Form state
  const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState<string>(submission.feedbackText || '');
  const [status, setStatus] = useState<'submitted' | 'graded' | 'returned'>(
    normalizeStatus(submission.status) as 'submitted' | 'graded' | 'returned'
  );
  const [requiresRevision, setRequiresRevision] = useState<boolean>(submission.requiresRevision || false);
  const [revisionDueDate, setRevisionDueDate] = useState<Date | null>(
    submission.revisionDueDate ? new Date(submission.revisionDueDate) : null
  );
  const [notes, setNotes] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when submission changes
  useEffect(() => {
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedbackText || '');
    setStatus(
      normalizeStatus(submission.status) as 'submitted' | 'graded' | 'returned'
    );
    setRequiresRevision(submission.requiresRevision || false);
    setRevisionDueDate(submission.revisionDueDate ? new Date(submission.revisionDueDate) : null);
    setError(null);
    setSuccessMessage(null);
  }, [submission]);

  // Form handlers
  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setGrade(value);
    }
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent<'submitted' | 'graded' | 'returned'>) => {
    setStatus(e.target.value as 'submitted' | 'graded' | 'returned');
  };

  const handleRequiresRevisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequiresRevision(e.target.checked);
    
    // If turning off revision requirement, clear the due date
    if (!e.target.checked) {
      setRevisionDueDate(null);
    } else if (!revisionDueDate) {
      // Set default due date to 7 days from now if turning on
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      setRevisionDueDate(defaultDueDate);
    }
  };

  const handleRevisionDueDateChange = (date: Date | null) => {
    setRevisionDueDate(date);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
  };

  const validateForm = (): boolean => {
    // Validate grade if provided
    if (grade) {
      const gradeValue = parseFloat(grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
        setError('Arvosanan tulee olla välillä 0-5');
        return false;
      }
    }
    
    // Validate feedback
    if (!feedback.trim()) {
      setError('Palaute on pakollinen');
      return false;
    }
    
    // Validate revision due date if revision is required
    if (requiresRevision && !revisionDueDate) {
      setError('Korjauksen määräaika on pakollinen, jos korjaus vaaditaan');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      let updatedSubmission;
      
      // If status is 'returned', use returnSubmission method
      if (status === 'returned') {
        const returnData: IReturnSubmission = {
          feedback,
          requiresRevision
        };
        
        updatedSubmission = await submissionService.returnSubmission(submission.id, returnData);
        setSuccessMessage('Palautus palautettu opiskelijalle onnistuneesti!');
      } else {
        // Otherwise use gradeSubmission method
        const gradeData: IGradeSubmission = {
          grade: grade ? parseFloat(grade) : undefined,
          feedback,
          requiresRevision,
          revisionDueDate: revisionDueDate ? revisionDueDate.toISOString() : undefined,
          notes: notes || undefined
        };
        
        updatedSubmission = await submissionService.gradeSubmission(submission.id, gradeData);
        setSuccessMessage('Arviointi tallennettu onnistuneesti!');
      }
      
      // Call the completion callback if provided
      if (onGradingComplete) {
        onGradingComplete(updatedSubmission);
      }
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Arvioinnin tallentaminen epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Arviointi
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">
          Opiskelija: {submission.studentName || 'Tuntematon'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Palautettu: {formatDate(submission.submittedAt)}
          {submission.isLate && (
            <Typography component="span" color="error" sx={{ ml: 1 }}>
              (Myöhässä)
            </Typography>
          )}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Arvosana (0-5)"
              fullWidth
              value={grade}
              onChange={handleGradeChange}
              disabled={isSubmitting}
              helperText="Syötä arvosana välillä 0-5"
              inputProps={{ inputMode: 'decimal', pattern: '[0-5](\.[0-9])?' }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Tila</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                onChange={handleStatusChange}
                label="Tila"
                disabled={isSubmitting}
              >
                <MenuItem value="submitted">Palautettu</MenuItem>
                <MenuItem value="graded">Arvioitu</MenuItem>
                <MenuItem value="returned">Palautettu opiskelijalle</MenuItem>
              </Select>
              <FormHelperText>
                Valitse palautuksen tila
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Palaute"
              fullWidth
              multiline
              rows={6}
              value={feedback}
              onChange={handleFeedbackChange}
              disabled={isSubmitting}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={requiresRevision}
                  onChange={handleRequiresRevisionChange}
                  disabled={isSubmitting}
                />
              }
              label="Vaatii korjausta"
            />
          </Grid>
          
          {requiresRevision && (
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fi}>
                <DateTimePicker
                  label="Korjauksen määräaika"
                  value={revisionDueDate}
                  onChange={handleRevisionDueDateChange}
                  disabled={isSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: requiresRevision
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              label="Muistiinpanot (vain opettajalle)"
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={handleNotesChange}
              disabled={isSubmitting}
              helperText="Nämä muistiinpanot näkyvät vain opettajille, ei opiskelijalle"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Tallennetaan...' : 'Tallenna arviointi'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default GradingFormV2; 