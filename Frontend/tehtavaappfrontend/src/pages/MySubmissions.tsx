import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { ISubmission, submissionService } from '../services/assignments/submissionService';
import { assignmentService } from '../services/assignments/assignmentService';
import { normalizeStatus, getStatusDisplayText, getStatusColor } from '../utils/submissionUtils';

const MySubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('MySubmissions-komponentti renderöidään, käyttäjä:', user);
  
  useEffect(() => {
    console.log('MySubmissions useEffect käynnistyy, käyttäjä:', user);
    
    const fetchSubmissions = async () => {
      if (!user?.id) {
        console.warn('Käyttäjää ei ole kirjautunut sisään tai käyttäjätunnusta ei ole saatavilla');
        setError('Et ole kirjautunut sisään tai käyttäjätunnusta ei ole saatavilla');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Haetaan palautuksia käyttäjälle:', user.id);
        console.log('Käyttäjän rooli:', user.role);
        
        // Haetaan opiskelijan kaikki palautukset
        const response = await submissionService.getSubmissionsByStudent(user.id);
        console.log('Palautukset haettu:', response);
        
        if (Array.isArray(response)) {
          // Log each submission's status for debugging
          response.forEach(submission => {
            console.log(`Submission ${submission.id} (${submission.assignmentTitle || 'Unnamed'}): Status = "${submission.status}" (${typeof submission.status})`);
          });
          
          setSubmissions(response);
          console.log(`Löydettiin ${response.length} palautusta`);
        } else {
          console.error('Palautukset eivät ole array-muodossa:', response);
          setError('Palautusten muoto on virheellinen');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Virhe palautusten haussa:', err);
        
        // Näytetään tarkempi virheviesti
        if (err instanceof Error) {
          setError(`Palautusten hakeminen epäonnistui: ${err.message}`);
        } else {
          setError('Palautusten hakeminen epäonnistui. Yritä myöhemmin uudelleen.');
        }
        
        setLoading(false);
      }
    };
    
    fetchSubmissions();
    
    return () => {
      console.log('MySubmissions useEffect cleanup');
    };
  }, [user]);
  
  const handleEditSubmission = (submissionId: string) => {
    navigate(`/submissions/edit/${submissionId}`);
  };
  
  const handleViewSubmission = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };
  
  const handleViewAssignment = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };
  
  // Custom function to get status chip with proper translation and color
  const getStatusChip = (status: any) => {
    console.log(`Processing status: "${status}" (${typeof status})`);
    
    if (!status) {
      console.log('No status provided, showing default chip');
      return <Chip label="Ei tietoa" color="default" size="small" />;
    }
    
    // Convert to lowercase for case-insensitive comparison
    const statusLower = String(status).toLowerCase();
    console.log(`Normalized status: "${statusLower}"`);
    
    let label = '';
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (statusLower) {
      case 'submitted':
      case 'palautettu':
        label = 'Palautettu';
        color = 'primary';
        break;
      case 'graded':
      case 'completed':
      case 'arvioitu':
        label = 'Arvioitu';
        color = 'success';
        break;
      case 'returned':
      case 'palautettu korjattavaksi':
        label = 'Palautettu korjattavaksi';
        color = 'warning';
        break;
      case 'published':
      case 'julkaistu':
        label = 'Julkaistu';
        color = 'info';
        break;
      case 'draft':
      case 'luonnos':
        label = 'Luonnos';
        color = 'default';
        break;
      case 'inprogress':
      case 'kesken':
        label = 'Kesken';
        color = 'info';
        break;
      case 'archived':
      case 'myöhässä':
        label = 'Myöhässä';
        color = 'error';
        break;
      default:
        label = String(status);
        color = 'default';
    }
    
    console.log(`Status "${statusLower}" mapped to label "${label}" with color "${color}"`);
    return <Chip label={label} color={color} size="small" />;
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
  
  return (
    <Container maxWidth="lg">
      <PageHeader title="Omat palautukseni" />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && submissions.length === 0 ? (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sinulla ei ole vielä palautuksia. Siirry tehtäväsivulle tehdäksesi palautuksen.
          </Alert>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/assignments')}
            sx={{ mt: 2 }}
          >
            Siirry tehtäviin
          </Button>
        </Box>
      ) : (
        !loading && !error && (
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tehtävä</TableCell>
                  <TableCell>Kurssi</TableCell>
                  <TableCell>Palautettu</TableCell>
                  <TableCell>Tila</TableCell>
                  <TableCell>Arvosana</TableCell>
                  <TableCell>Toiminnot</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.assignmentTitle || "Tehtävä " + submission.assignmentId}</TableCell>
                    <TableCell>{submission.courseName || "-"}</TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleString('fi-FI')}
                      {submission.isLate && (
                        <Chip label="Myöhässä" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(submission.status)}</TableCell>
                    <TableCell>
                      {submission.grade !== undefined && submission.grade !== null ? 
                        submission.grade : 
                        submission.status === 'graded' ? 'Arvioitu' : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Katso palautus">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSubmission(submission.id)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {(submission.status !== 'graded' || submission.requiresRevision) && (
                          <Tooltip title={submission.requiresRevision ? "Tee korjaukset palautukseen" : "Muokkaa palautusta"}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditSubmission(submission.id)}
                              color="primary"
                              sx={{ ml: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Katso tehtävä">
                          <IconButton
                            size="small"
                            onClick={() => handleViewAssignment(submission.assignmentId)}
                            sx={{ ml: 1 }}
                          >
                            <SchoolIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default MySubmissions; 