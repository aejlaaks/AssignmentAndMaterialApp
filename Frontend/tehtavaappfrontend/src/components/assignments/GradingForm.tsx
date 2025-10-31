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
import { Psychology as PsychologyIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fi } from 'date-fns/locale';
import { ISubmission, IGradeSubmission, submissionService, IReturnSubmission } from '../../services/assignments/submissionService';
import { normalizeStatus } from '../../utils/submissionUtils';
import { AIGradingResult } from '../../types';
import aiGradingService from '../../services/aiGradingService';
import AIGradingSuggestion from './AIGradingSuggestion';

interface GradingFormProps {
  submission: ISubmission;
  onGradingComplete?: (updatedSubmission: ISubmission) => void;
}

export const GradingForm: React.FC<GradingFormProps> = ({ submission, onGradingComplete }) => {
  const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState<string>(submission.feedbackText || '');
  const [status, setStatus] = useState<'submitted' | 'graded' | 'returned'>(
    normalizeStatus(submission.status) as 'submitted' | 'graded' | 'returned'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [requiresRevision, setRequiresRevision] = useState<boolean>(submission.requiresRevision || false);
  const [revisionDueDate, setRevisionDueDate] = useState<Date | null>(
    submission.requiresRevision ? new Date() : null
  );
  const [notes, setNotes] = useState<string>('');
  
  // AI Grading states
  const [aiResult, setAiResult] = useState<AIGradingResult | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    // Reset form when submission changes
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedbackText || '');
    setStatus(
      normalizeStatus(submission.status) as 'submitted' | 'graded' | 'returned'
    );
    setRequiresRevision(submission.requiresRevision || false);
    setError(null);
    setSuccess(false);
  }, [submission]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const gradeData: IGradeSubmission = {
        grade: grade ? parseFloat(grade) : undefined,
        feedback,
        requiresRevision,
        revisionDueDate: revisionDueDate ? revisionDueDate.toISOString() : undefined,
        notes
      };

      // Validate grade
      if (gradeData.grade !== undefined && (gradeData.grade < 0 || gradeData.grade > 5)) {
        setError('Arvosanan tulee olla välillä 0-5');
        setIsSubmitting(false);
        return;
      }

      let updatedSubmission;
      
      // Jos status on 'returned', käytetään returnSubmission-metodia
      if (status === 'returned') {
        // Luodaan returnData-objekti
        const returnData: IReturnSubmission = {
          feedback,
          requiresRevision
        };
        
        // Ensin arvioidaan tehtävä, jotta arvosana tallentuu
        if (gradeData.grade !== undefined) {
          await submissionService.gradeSubmission(submission.id, gradeData);
        }
        
        // Sitten palautetaan tehtävä opiskelijalle
        updatedSubmission = await submissionService.returnSubmission(submission.id, returnData);
      } else {
        // Muuten käytetään gradeSubmission-metodia
        updatedSubmission = await submissionService.gradeSubmission(submission.id, gradeData);
      }

      setSuccess(true);
      setIsSubmitting(false);

      if (onGradingComplete) {
        onGradingComplete(updatedSubmission);
      }
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Arvioinnin tallentaminen epäonnistui. Yritä uudelleen.');
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const handleGenerateAIGrading = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    
    try {
      const result = await aiGradingService.generateAIGrading(submission.id);
      setAiResult(result);
    } catch (err) {
      console.error('Error generating AI grading:', err);
      setAiError(err instanceof Error ? err.message : 'AI-arvioinnin luominen epäonnistui');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAcceptAIGrading = async (result: AIGradingResult) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Apply the AI grading to the submission
      const updatedSubmission = await aiGradingService.applyAIGrading(submission.id, result);
      
      setSuccess(true);
      setAiResult(null); // Clear AI result after applying
      
      if (onGradingComplete) {
        onGradingComplete(updatedSubmission);
      }
    } catch (err) {
      console.error('Error applying AI grading:', err);
      setError('AI-arvioinnin käyttö epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAIGrading = () => {
    setAiResult(null);
    setAiError(null);
  };

  const handleModifyAIGrading = (result: AIGradingResult) => {
    // Pre-fill the form with AI-generated values
    setGrade(result.grade.toString());
    setFeedback(result.feedback);
    setAiResult(null);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Arvioi palautus
      </Typography>
      
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Opiskelija: {submission.studentName || submission.studentId}
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
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Palautuksen sisältö:
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50', maxHeight: '200px', overflow: 'auto' }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {submission.submissionText}
        </Typography>
      </Paper>

      {/* AI Grading Section */}
      <Box mb={3}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={isGeneratingAI ? <CircularProgress size={20} /> : <PsychologyIcon />}
          onClick={handleGenerateAIGrading}
          disabled={isGeneratingAI || !!aiResult}
          fullWidth
        >
          {isGeneratingAI ? 'Luodaan AI-arviointia...' : 'Luo AI-arviointiehdotus'}
        </Button>
        
        {aiError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setAiError(null)}>
            {aiError}
          </Alert>
        )}
      </Box>

      {aiResult && (
        <Box mb={3}>
          <AIGradingSuggestion
            aiResult={aiResult}
            onAccept={handleAcceptAIGrading}
            onReject={handleRejectAIGrading}
            onModify={handleModifyAIGrading}
            isLoading={isSubmitting}
          />
        </Box>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
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
            </FormControl>
          </Grid>
          
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
          
          <Grid item xs={12}>
            <TextField
              label="Palaute"
              fullWidth
              multiline
              rows={4}
              value={feedback}
              onChange={handleFeedbackChange}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={requiresRevision}
                  onChange={(e) => setRequiresRevision(e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label="Vaatii korjauksia"
            />
          </Grid>
          
          {requiresRevision && (
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fi}>
                <DateTimePicker
                  label="Korjausten määräaika"
                  value={revisionDueDate}
                  onChange={(newValue) => setRevisionDueDate(newValue)}
                  disabled={isSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Valitse määräaika korjauksille'
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
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              helperText="Nämä muistiinpanot näkyvät vain opettajille, ei opiskelijoille"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Tallennetaan...' : 'Tallenna arviointi'}
              </Button>
            </Stack>
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
          Arviointi tallennettu onnistuneesti!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default GradingForm; 