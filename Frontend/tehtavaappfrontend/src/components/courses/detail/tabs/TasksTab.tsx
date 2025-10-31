import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { assignmentService } from '../../../../services/assignments/assignmentService';
import { useNavigate } from 'react-router-dom';
import { Assignment } from '../../../../types/assignment';

interface TasksTabProps {
  courseId: string;
  isOwner: boolean;
}

/**
 * Component to display and manage course tasks/assignments
 * 
 * Follows the same pattern as MaterialsTab and existing AssignmentsTab components
 */
const TasksTab: React.FC<TasksTabProps> = ({ courseId, isOwner }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log('TasksTab mounted with courseId:', courseId, 'isOwner:', isOwner);

  // Create a global function to delete assignments for direct testing
  useEffect(() => {
    // @ts-ignore
    window.deleteAssignment = async (id: string) => {
      console.log(`Global deleteAssignment called with id: ${id}`);
      try {
        await assignmentService.deleteAssignment(id);
        alert(`Assignment ${id} deleted via global function`);
        fetchAssignments();
        return true;
      } catch (error: any) {
        console.error('Global delete error:', error);
        alert(`Error deleting assignment: ${error.message || 'Unknown error'}`);
        return false;
      }
    };

    return () => {
      // @ts-ignore
      delete window.deleteAssignment;
    };
  }, []);

  // Fetch assignments when component mounts or refresh is triggered
  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments for course:', courseId);
      setLoading(true);
      const result = await assignmentService.getAssignmentsByCourse(courseId);
      console.log('Fetched assignments:', result);
      setAssignments(result);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    } else {
      console.error('No courseId provided to TasksTab');
    }
  }, [courseId]);

  // Show delete confirmation dialog
  const confirmDeleteAssignment = (assignmentId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click event
    console.log('Confirming delete for assignment:', assignmentId);
    setAssignmentToDelete(assignmentId);
    setDeleteDialogOpen(true);
  };
  
  // Test delete without using backend (for debugging)
  const testDeleteLocally = () => {
    if (!assignmentToDelete) return;
    
    console.log('Test deleting assignment locally:', assignmentToDelete);
    // Just remove it from the local state to see if UI updates correctly
    setAssignments(currentAssignments => 
      currentAssignments.filter(a => a.id !== assignmentToDelete)
    );
    
    alert('Assignment removed from UI only (not from database)');
    setDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  // Handle deleting an assignment - simplified version
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    try {
      console.log('Executing delete for assignment:', assignmentToDelete);
      
      // Call the service to delete the assignment
      await assignmentService.deleteAssignment(assignmentToDelete);
      
      // Immediately remove from local state for faster UI update
      setAssignments(current => current.filter(a => a.id !== assignmentToDelete));
      
      // Then refresh assignments from server
      fetchAssignments();
      
      alert('Tehtävä poistettu onnistuneesti');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Virhe tehtävän poistamisessa: ' + (error instanceof Error ? error.message : 'Tuntematon virhe'));
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    }
  };

  // Handle adding an assignment
  const handleAddAssignment = () => {
    navigate(`/assignments/new?courseId=${courseId}`);
  };

  if (loading && assignments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Kurssin tehtävät</Typography>
        <Box>
          <Tooltip title="Päivitä tehtävät">
            <IconButton onClick={fetchAssignments} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {isOwner && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddAssignment}
            >
              Lisää tehtävä
            </Button>
          )}
        </Box>
      </Box>

      {assignments.length > 0 ? (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} md={4} key={assignment.id}>
              <Card sx={{ position: 'relative', height: '100%' }}>
                <CardContent>
                  {isOwner && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                      <Tooltip title="Muokkaa">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assignments/edit/${assignment.id}`);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Poista">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete icon clicked for:', assignment.id);
                            confirmDeleteAssignment(assignment.id, e);
                          }}
                          data-testid={`delete-assignment-${assignment.id}`}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  <Box 
                    onClick={() => navigate(`/assignments/${assignment.id}`)}
                    sx={{ cursor: 'pointer', pt: 1 }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {assignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {assignment.description && assignment.description.length > 100
                        ? `${assignment.description.substring(0, 100)}...`
                        : assignment.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip 
                        label={assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      {assignment.points && (
                        <Chip 
                          label={`${assignment.points} points`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          No tasks available for this course. {isOwner && 'Click "Add Task" to add assignments.'}
        </Typography>
      )}

      {/* Delete Confirmation Dialog - Simplified */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Poista tehtävä
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haluatko varmasti poistaa tämän tehtävän?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Peruuta
          </Button>
          <Button 
            onClick={handleDeleteAssignment} 
            color="error" 
            variant="contained"
            autoFocus
          >
            Poista
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency deletion testing section */}
      {isOwner && assignments.length > 0 && (
        <Box sx={{ mt: 4, p: 2, border: '2px dashed red', borderRadius: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Emergency Assignment Deletion Testing
          </Typography>
          <Typography variant="body2" gutterBottom>
            If the regular delete buttons aren't working, use these emergency buttons:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {assignments.map(assignment => (
              <Grid item xs={12} sm={6} md={4} key={`emergency-${assignment.id}`}>
                <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {assignment.title}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    ID: {assignment.id}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="error"
                    fullWidth
                    onClick={() => {
                      console.log('Emergency delete button clicked for:', assignment.id);
                      if (window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
                        const deleteDirectly = async () => {
                          try {
                            console.log('Starting direct deletion for:', assignment.id);
                            await assignmentService.deleteAssignment(assignment.id);
                            console.log('Deletion completed successfully');
                            alert(`Successfully deleted assignment: ${assignment.title}`);
                            fetchAssignments();
                          } catch (err: any) {
                            console.error('Emergency delete error:', err);
                            // Check if this is our special constraint error message
                            if (err.message && err.message.includes('REFERENCE constraint')) {
                              alert('Tehtävää ei voitu poistaa, koska siihen liittyy ilmoituksia tai muita tietoja. Käytä AssignmentDetail-sivua poistamiseen.');
                            } else {
                              alert(`Failed to delete: ${err.message || 'Unknown error'}`);
                            }
                          }
                        };
                        deleteDirectly();
                      }
                    }}
                  >
                    Delete {assignment.title}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Note: This section is only visible to course owners for troubleshooting purposes.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TasksTab; 