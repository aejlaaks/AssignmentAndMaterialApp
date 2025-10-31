import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { GradingForm } from '../components/assignments';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { ISubmission, submissionService } from '../services/assignments/submissionService';
import { assignmentService } from '../services/assignments/assignmentService';
import { normalizeStatus, getStatusDisplayText, getStatusColor } from '../utils/submissionUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submissions-tabpanel-${index}`}
      aria-labelledby={`submissions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const SubmissionsView = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ISubmission | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) {
        setError('Tehtävän tunnistetta ei löytynyt');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Haetaan tehtävän tiedot
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);
        
        // Haetaan tehtävän palautukset
        const submissionsData = await submissionService.getSubmissionsByAssignment(assignmentId);
        setSubmissions(submissionsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Palautusten hakeminen epäonnistui');
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  // Tarkistetaan käyttäjän rooli
  if (user?.role !== UserRole.Teacher && user?.role !== UserRole.Admin) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Sinulla ei ole oikeuksia tarkastella tätä sivua. Vain opettajat ja ylläpitäjät voivat arvioida palautuksia.
        </Alert>
      </Container>
    );
  }

  const handleSubmissionSelect = (submission: ISubmission) => {
    setSelectedSubmission(submission);
    setActiveTab(1); // Vaihda arviointivälilehdelle
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGradingComplete = (updatedSubmission: ISubmission) => {
    // Päivitä palautus listassa
    setSubmissions(submissions.map(sub => 
      sub.id === updatedSubmission.id ? updatedSubmission : sub
    ));
    
    // Päivitä valittu palautus
    setSelectedSubmission(updatedSubmission);
  };

  const handleBack = () => {
    navigate(`/assignments/${assignmentId}`);
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

  const getStatusChip = (status: any) => {
    if (!status) return <Chip label="Ei tietoa" color="default" size="small" />;
    
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
    
    return <Chip label={label} color={color} size="small" />;
  };

  return (
    <Container maxWidth="lg">
      <PageHeader 
        title="Palautusten arviointi" 
        showBackButton={true}
      />
      
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link color="inherit" href="/assignments" onClick={(e) => { e.preventDefault(); navigate('/assignments'); }}>
          Tehtävät
        </Link>
        <Link 
          color="inherit" 
          href={`/assignments/${assignmentId}`} 
          onClick={(e) => { e.preventDefault(); navigate(`/assignments/${assignmentId}`); }}
        >
          {assignment?.title || 'Tehtävä'}
        </Link>
        <Typography color="text.primary">Palautukset</Typography>
      </Breadcrumbs>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="submissions tabs">
          <Tab label="Palautukset" id="submissions-tab-0" aria-controls="submissions-tabpanel-0" />
          {selectedSubmission && (
            <Tab label="Arviointi" id="submissions-tab-1" aria-controls="submissions-tabpanel-1" />
          )}
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h5" gutterBottom>
          {assignment?.title} - Palautukset ({submissions.length})
        </Typography>
        
        {submissions.length === 0 ? (
          <Alert severity="info">Ei palautuksia</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Opiskelija</TableCell>
                  <TableCell>Palautettu</TableCell>
                  <TableCell>Tila</TableCell>
                  <TableCell>Arvosana</TableCell>
                  <TableCell>Palaute</TableCell>
                  <TableCell>Toiminnot</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.studentName || submission.studentId}</TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleString('fi-FI')}
                      {submission.isLate && (
                        <Chip 
                          label="Myöhässä" 
                          color="error" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(submission.status)}</TableCell>
                    <TableCell>{submission.grade !== undefined && submission.grade !== null ? submission.grade : '-'}</TableCell>
                    <TableCell>
                      {submission.feedbackText ? (
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {submission.feedbackText.substring(0, 50)}
                          {submission.feedbackText.length > 50 ? '...' : ''}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleSubmissionSelect(submission)}
                      >
                        Arvioi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {selectedSubmission && (
          <>
            <Box sx={{ mb: 2 }}>
              <Button 
                startIcon={<ArrowBackIcon />}
                onClick={() => setActiveTab(0)}
              >
                Takaisin palautuksiin
              </Button>
            </Box>
            <GradingForm 
              submission={selectedSubmission} 
              onGradingComplete={handleGradingComplete}
            />
          </>
        )}
      </TabPanel>
    </Container>
  );
};

export default SubmissionsView; 