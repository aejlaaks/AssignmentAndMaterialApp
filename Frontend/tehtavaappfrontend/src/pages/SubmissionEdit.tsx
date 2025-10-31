import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  Alert,
  Box,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { ISubmission, submissionService } from '../services/assignments/submissionService';
import SubmissionEditForm from '../components/assignments/SubmissionEditForm';

const SubmissionEdit: React.FC = () => {
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
        
        // Tarkista onko tämä käyttäjän oma palautus
        if (data.studentId !== user?.id && user?.role !== 'Teacher' && user?.role !== 'Admin') {
          setError('Sinulla ei ole oikeuksia muokata tätä palautusta');
          setLoading(false);
          return;
        }
        
        // Tarkista onko palautus jo arvioitu
        if (data.status === 'graded') {
          setError('Tätä palautusta ei voi enää muokata, koska se on jo arvioitu');
          setLoading(false);
          return;
        }
        
        setSubmission(data);
        setLoading(false);
      } catch (err) {
        console.error('Virhe palautuksen haussa:', err);
        setError('Palautuksen hakeminen epäonnistui');
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [id, user]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleUpdateComplete = (updatedSubmission: ISubmission) => {
    setSubmission(updatedSubmission);
    // Ohjaa takaisin palautuksen tietoihin muokkauksen jälkeen
    setTimeout(() => {
      navigate(`/submissions/${id}`);
    }, 1500);
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
        <PageHeader title="Muokkaa palautusta" showBackButton={true} />
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        <Box mt={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Takaisin
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!submission) {
    return (
      <Container sx={{ mt: 4 }}>
        <PageHeader title="Muokkaa palautusta" showBackButton={true} />
        <Alert severity="error" sx={{ mt: 2 }}>Palautusta ei löytynyt</Alert>
        <Box mt={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Takaisin
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <PageHeader title="Muokkaa palautusta" showBackButton={true} />
      
      <SubmissionEditForm 
        submission={submission} 
        onUpdateComplete={handleUpdateComplete}
      />
    </Container>
  );
};

export default SubmissionEdit; 