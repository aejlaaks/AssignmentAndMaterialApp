import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { ISubmission, submissionService } from '../services/assignments/submissionService';
import { normalizeStatus, getStatusDisplayText, getStatusColor } from '../utils/submissionUtils';

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submission, setSubmission] = useState<ISubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
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
        setLoading(false);
      } catch (err) {
        console.error('Virhe palautuksen haussa:', err);
        setError('Palautuksen hakeminen epäonnistui');
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id]);
  
  const handleBack = () => {
    navigate('/submissions');
  };
  
  const handleEdit = () => {
    if (id) {
      navigate(`/submissions/edit/${id}`);
    }
  };
  
  const handleViewAssignment = () => {
    if (submission) {
      navigate(`/assignments/${submission.assignmentId}`);
    }
  };
  
  const getStatusChip = (status: any) => {
    if (!status) return <Chip label="Ei tietoa" color="default" />;
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = String(status).toLowerCase();
    
    let label = '';
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (statusLower) {
      case 'submitted':
        label = 'Palautettu';
        color = 'primary';
        break;
      case 'graded':
      case 'completed':
        label = 'Arvioitu';
        color = 'success';
        break;
      case 'returned':
        label = 'Palautettu korjattavaksi';
        color = 'warning';
        break;
      case 'published':
        label = 'Julkaistu';
        color = 'info';
        break;
      case 'draft':
        label = 'Luonnos';
        color = 'default';
        break;
      case 'inprogress':
        label = 'Kesken';
        color = 'info';
        break;
      case 'archived':
        label = 'Myöhässä';
        color = 'error';
        break;
      default:
        label = String(status);
        color = 'default';
    }
    
    return <Chip label={label} color={color} />;
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  if (!submission) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Palautusta ei löytynyt</Alert>
      </Container>
    );
  }
  
  // Tarkistetaan oikeudet - vain oma palautus tai opettaja
  const isOwnSubmission = user?.id === submission.studentId;
  if (!isOwnSubmission && user?.role !== 'Teacher' && user?.role !== 'Admin') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Sinulla ei ole oikeuksia tarkastella tätä palautusta</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <PageHeader title="Palautuksen tiedot" showBackButton={true} />
      
      <Box mb={2} display="flex" justifyContent="space-between">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
        >
          Takaisin palautuksiin
        </Button>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={handleViewAssignment} 
            sx={{ mr: 1 }}
          >
            Näytä tehtävä
          </Button>
          
          {isOwnSubmission && (submission.status !== 'graded' || submission.requiresRevision) && (
            <Button 
              variant="contained" 
              onClick={handleEdit}
              color={submission.requiresRevision ? "warning" : "primary"}
            >
              {submission.requiresRevision ? "Tee korjaukset" : "Muokkaa palautusta"}
            </Button>
          )}
        </Box>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box mb={2}>
          <Typography variant="h5" gutterBottom>
            {submission.assignmentTitle || `Tehtävä ${submission.assignmentId}`}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary">
            Kurssi: {submission.courseName || '-'}
          </Typography>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Palautuksen tila</Typography>
            <Box>{getStatusChip(submission.status)}</Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Palautettu</Typography>
            <Typography>
              {new Date(submission.submittedAt).toLocaleString('fi-FI')}
              {submission.isLate && (
                <Chip label="Myöhässä" color="error" size="small" sx={{ ml: 1 }} />
              )}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Opiskelija</Typography>
            <Typography>{submission.studentName || submission.studentId}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>Palautuksen sisältö</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50', maxHeight: '400px', overflow: 'auto' }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {submission.submissionText}
          </Typography>
        </Paper>
        
        {(submission.status === 'graded' || submission.status === 'returned') && (
          <>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="h6" gutterBottom>Arviointi</Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Arvosana</Typography>
                <Typography variant="h5">{submission.grade !== undefined && submission.grade !== null ? submission.grade : '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <Typography variant="subtitle2">Palaute</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {submission.feedbackText || 'Ei palautetta'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {submission.requiresRevision && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Vaatii korjauksia</Typography>
                {submission.revisionDueDate && (
                  <Typography variant="body2">
                    Korjausten määräaika: {new Date(submission.revisionDueDate).toLocaleString('fi-FI')}
                  </Typography>
                )}
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default SubmissionDetail; 