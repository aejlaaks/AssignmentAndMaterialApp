import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import GradeIcon from '@mui/icons-material/Grade';
import SubmissionViewer from './SubmissionViewer';
import EnhancedFeedback from './EnhancedFeedback';
import { feedbackService, FeedbackAttachment } from '../../services/feedbackService';
import { inlineCommentService } from '../../services/inlineCommentService';

interface EnhancedGradingProps {
  submissionId: string;
  submissionText: string;
  initialFeedback?: string;
  initialGrade?: number;
  initialAttachments?: FeedbackAttachment[];
  readOnly?: boolean;
  onGradeSubmit?: (grade: number, feedback: string, isRichText: boolean, attachments: FeedbackAttachment[]) => Promise<boolean>;
}

const EnhancedGrading: React.FC<EnhancedGradingProps> = ({
  submissionId,
  submissionText,
  initialFeedback = '',
  initialGrade,
  initialAttachments = [],
  readOnly = false,
  onGradeSubmit
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isRichText, setIsRichText] = useState(false);
  const [grade, setGrade] = useState<number | undefined>(initialGrade);
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>(initialAttachments);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCommentCount();
  }, [submissionId]);

  const fetchCommentCount = async () => {
    try {
      const comments = await inlineCommentService.getCommentsBySubmission(submissionId);
      setCommentCount(comments.length);
    } catch (err) {
      console.error('Error fetching comment count:', err);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFeedbackChange = (newFeedback: string, richText: boolean) => {
    setFeedback(newFeedback);
    setIsRichText(richText);
  };

  const handleGradeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '') {
      setGrade(undefined);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setGrade(numValue);
      }
    }
  };

  const handleAttachmentAdd = async (file: File, description: string): Promise<FeedbackAttachment> => {
    try {
      const newAttachment = await feedbackService.addAttachment(submissionId, file, description);
      setAttachments([...attachments, newAttachment]);
      return newAttachment;
    } catch (err) {
      console.error('Error adding attachment:', err);
      throw err;
    }
  };

  const handleAttachmentRemove = async (attachmentId: string): Promise<boolean> => {
    try {
      const success = await feedbackService.removeAttachment(submissionId, attachmentId);
      if (success) {
        setAttachments(attachments.filter(a => a.id !== attachmentId));
      }
      return success;
    } catch (err) {
      console.error('Error removing attachment:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!onGradeSubmit) return;

    try {
      setLoading(true);
      const success = await onGradeSubmit(grade || 0, feedback, isRichText, attachments);
      if (success) {
        setSuccess('Submission graded successfully');
      } else {
        setError('Failed to grade submission');
      }
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('An error occurred while grading the submission');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    fetchCommentCount();
  };

  const handleCommentUpdated = () => {
    fetchCommentCount();
  };

  const handleCommentDeleted = () => {
    fetchCommentCount();
  };

  const handleCloseAlert = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="grading tabs">
            <Tab 
              icon={<CommentIcon />} 
              label="Submission & Comments" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<FormatColorTextIcon />} 
              label="Feedback" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<GradeIcon />} 
              label="Grade" 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Submission with Inline Comments</Typography>
              {commentCount > 0 && (
                <Chip 
                  label={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`} 
                  color="primary" 
                  size="small"
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            <SubmissionViewer
              submissionId={submissionId}
              submissionText={submissionText}
              readOnly={readOnly}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <EnhancedFeedback
              initialFeedback={feedback}
              isRichText={isRichText}
              attachments={attachments}
              readOnly={readOnly}
              onFeedbackChange={handleFeedbackChange}
              onAttachmentAdd={handleAttachmentAdd}
              onAttachmentRemove={handleAttachmentRemove}
            />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Grade</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Grade"
                  type="number"
                  fullWidth
                  value={grade === undefined ? '' : grade}
                  onChange={handleGradeChange}
                  disabled={readOnly}
                  InputProps={{
                    inputProps: { 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Enter a grade between 0 and 100. You can use decimal points for partial grades.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {!readOnly && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Submit Grading
            </Button>
          </Box>
        )}

        <Snackbar open={!!success || !!error} autoHideDuration={6000} onClose={handleCloseAlert}>
          <Alert 
            onClose={handleCloseAlert} 
            severity={success ? "success" : "error"} 
            sx={{ width: '100%' }}
          >
            {success || error}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default EnhancedGrading; 