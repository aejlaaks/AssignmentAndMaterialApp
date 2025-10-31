import { type FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grading as GradingIcon
} from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAssignments } from '../hooks/useAssignments';
import { useAuth } from '../hooks/useAuth';
import { IAssignment } from '../services/assignments/assignmentService';
import { UserRole } from '../types';
import AssignmentView from '../components/assignments/AssignmentView';

const AssignmentDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAssignmentById, deleteAssignment, isLoading, error } = useAssignments();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const isAdminOrTeacher = user?.role === UserRole.Admin || user?.role === UserRole.Teacher;
  const isStudent = user?.role === UserRole.Student;

  useEffect(() => {
    const fetchAssignment = async () => {
      if (id) {
        try {
          const data = await getAssignmentById(id);
          if (data) {
            // Debug log to see raw assignment data
            console.log('Assignment detail raw data:', data);
            console.log('Status from API:', data.status);
            
            // Make sure to map the data to IAssignment if needed
            const assignmentData = data as unknown as IAssignment;
            setAssignment(assignmentData);
          }
        } catch (err) {
          console.error(`Error fetching assignment with ID ${id}:`, err);
          // Error is already set in the useAssignments hook
        }
      } else {
        // If no ID is provided, navigate back to assignments list
        navigate('/assignments');
      }
    };

    fetchAssignment();
  }, [id, getAssignmentById, navigate]);

  const handleEdit = () => {
    navigate(`/assignments/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setDeleteLoading(true);
    try {
      await deleteAssignment(id);
      setSnackbarMessage('Tehtävä poistettu onnistuneesti');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Sulje dialogi ja navigoi takaisin tehtävälistaan pienen viiveen jälkeen
      setDeleteDialogOpen(false);
      setTimeout(() => {
        navigate('/assignments');
      }, 1500);
    } catch (error) {
      console.error('Virhe poistettaessa tehtävää:', error);
      setSnackbarMessage('Tehtävän poistaminen epäonnistui');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleBack = () => {
    navigate('/assignments');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!assignment) {
    return <ErrorAlert message="Assignment not found" />;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  // Check if due date is valid before comparing
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = !isNaN(dueDate.getTime()) && dueDate < new Date();

  return (
    <Box>
      <PageHeader
        title="Tehtävän tiedot"
        showBackButton={true}
      />

      {/* Toimintopainikkeet opettajille ja ylläpitäjille */}
      {isAdminOrTeacher && (
        <Box mb={3}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/assignments/edit/${assignment.id}`)}
            >
              Muokkaa tehtävää
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteDialog}
            >
              Poista tehtävä
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<GradingIcon />}
              onClick={() => navigate(`/assignments/${assignment.id}/submissions`)}
            >
              Tarkastele palautuksia
            </Button>
          </Stack>
        </Box>
      )}

      {/* Näytetään AssignmentView kaikille käyttäjille */}
      <AssignmentView assignment={assignment} />

      {/* Poistovahvistusdialogi */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Poista tehtävä</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haluatko varmasti poistaa tehtävän "{assignment?.title}"? Tätä toimintoa ei voi peruuttaa.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Peruuta
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Poistetaan...' : 'Poista'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ilmoitusviesti */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentDetail;
