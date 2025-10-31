import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Button,
  Divider
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EnhancedGrading from './EnhancedGrading';
import { submissionService } from '../../services/submissionService';
import { FeedbackAttachment } from '../../services/feedbackService';

interface RouteParams {
  submissionId: string;
}

const GradingPage: React.FC = () => {
  const { submissionId } = useParams<keyof RouteParams>() as RouteParams;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const data = await submissionService.getSubmissionById(submissionId);
        setSubmission(data);
        
        // If there are feedback attachments, set them
        if (data.feedbackAttachments && Array.isArray(data.feedbackAttachments)) {
          setAttachments(data.feedbackAttachments);
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to load submission. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const handleGradeSubmit = async (
    grade: number, 
    feedback: string, 
    isRichText: boolean, 
    attachments: FeedbackAttachment[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      const gradeData = {
        grade,
        feedback,
        isRichTextFeedback: isRichText,
        attachments
      };
      
      await submissionService.gradeSubmission(submissionId, gradeData);
      return true;
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Failed to grade submission. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading && !submission) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBackToList}
          >
            Back to Submissions
          </Button>
        </Box>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 3 }}>
          Submission not found.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBackToList}
          >
            Back to Submissions
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToList}
          sx={{ mb: 2 }}
        >
          Back to Submissions
        </Button>
        
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 3 }}
        >
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href={`/courses/${submission.courseId}`}>
            {submission.courseName || 'Course'}
          </Link>
          <Link color="inherit" href={`/assignments/${submission.assignmentId}`}>
            {submission.assignmentName || 'Assignment'}
          </Link>
          <Typography color="text.primary">Grade Submission</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {submission.assignmentName || 'Assignment Submission'}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Student: {submission.studentName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </Typography>
            {submission.isLate && (
              <Typography variant="body2" color="error">
                Late submission
              </Typography>
            )}
          </Box>
          
          <EnhancedGrading
            submissionId={submissionId}
            submissionText={submission.submissionText || ''}
            initialFeedback={submission.feedbackText || ''}
            initialGrade={submission.grade}
            initialAttachments={attachments}
            onGradeSubmit={handleGradeSubmit}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default GradingPage; 