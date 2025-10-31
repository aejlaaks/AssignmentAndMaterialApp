import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { SubmissionViewer, SubmissionCreator } from '../components/assignments/submission';
import { submissionService, ISubmission } from '../services/assignments/submissionService';
import { assignmentService, IAssignment } from '../services/assignments/assignmentService';
import { useAuth } from '../hooks/useAuth';

// Extended assignment interface to include courseName
interface ExtendedAssignment extends IAssignment {
  courseName?: string;
}

const EnhancedSubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submission, setSubmission] = useState<ISubmission | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) {
        setError('Palautuksen tunnistetta ei löytynyt');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await submissionService.getSubmissionById(id);
        setSubmission(data);
        
        // Fetch assignment details to get title and course name
        try {
          const assignmentData = await assignmentService.getAssignmentById(data.assignmentId);
          if (assignmentData) {
            setAssignmentTitle(assignmentData.title);
            // Cast to ExtendedAssignment to access courseName
            const extendedAssignment = assignmentData as ExtendedAssignment;
            setCourseName(extendedAssignment.courseName || '');
          }
        } catch (err) {
          console.error('Error fetching assignment details:', err);
          // Not setting error here as we still have the submission
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Palautuksen hakeminen epäonnistui');
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleSubmissionComplete = async (submissionId: string) => {
    try {
      // Refresh submission data
      const updatedSubmission = await submissionService.getSubmissionById(submissionId);
      setSubmission(updatedSubmission);
      setIsEditing(false);
    } catch (err) {
      console.error('Error refreshing submission:', err);
      setError('Palautuksen päivittäminen onnistui, mutta tietojen hakeminen epäonnistui');
    }
  };
  
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      // This is a placeholder - actual implementation would depend on your API
      // Since downloadSubmissionFile doesn't exist, we'll just show an alert
      console.log(`Would download file: ${fileId} - ${fileName}`);
      alert(`Tiedoston lataaminen: ${fileName}`);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Tiedoston lataaminen epäonnistui');
    }
  };
  
  // Check if user has permission to view this submission
  const canViewSubmission = () => {
    if (!user || !submission) return false;
    
    // Teachers and admins can view all submissions
    if (user.role === 'Teacher' || user.role === 'Admin') return true;
    
    // Students can only view their own submissions
    return user.id === submission.studentId;
  };
  
  // Check if user has permission to edit this submission
  const canEditSubmission = () => {
    if (!user || !submission) return false;
    
    // Students can edit their own submissions if:
    // 1. The submission is not graded/returned, OR
    // 2. The submission requires revision (even if graded)
    return (
      user.id === submission.studentId && 
      (submission.status !== 'graded' || submission.requiresRevision) && 
      (submission.status !== 'returned' || submission.requiresRevision)
    );
  };
  
  if (!canViewSubmission() && !loading && submission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <PageHeader title="Palautuksen tiedot" showBackButton={true} />
        <Alert severity="error" sx={{ mt: 2 }}>
          Sinulla ei ole oikeuksia tarkastella tätä palautusta
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <PageHeader title="Palautuksen tiedot" showBackButton={true} />
      
      {assignmentTitle && (
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/assignments')} sx={{ cursor: 'pointer' }}>
            Tehtävät
          </Link>
          {courseName && (
            <Link color="inherit" onClick={() => navigate('/courses')} sx={{ cursor: 'pointer' }}>
              {courseName}
            </Link>
          )}
          <Link color="inherit" onClick={() => navigate(`/assignments/${submission?.assignmentId}`)} sx={{ cursor: 'pointer' }}>
            {assignmentTitle}
          </Link>
          <Typography color="text.primary">Palautus</Typography>
        </Breadcrumbs>
      )}
      
      {isEditing && submission ? (
        <SubmissionCreator
          assignmentId={submission.assignmentId}
          existingSubmissionId={submission.id}
          initialContent={submission.submissionText || ''}
          onSubmissionComplete={handleSubmissionComplete}
          onCancel={handleCancelEdit}
        />
      ) : (
        <>
          <SubmissionViewer
            submission={submission}
            loading={loading}
            error={error}
            onEdit={canEditSubmission() ? handleEdit : undefined}
            onDownloadFile={handleDownloadFile}
          />
          
          {!loading && !error && submission && canEditSubmission() && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Button
                variant="contained"
                color={submission.requiresRevision ? "warning" : "primary"}
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                {submission.requiresRevision ? "Tee korjaukset" : "Muokkaa palautusta"}
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default EnhancedSubmissionDetail; 