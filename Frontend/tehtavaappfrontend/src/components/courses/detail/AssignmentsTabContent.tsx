import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Snackbar, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useCourseAssignments } from '../../../hooks/useCourseAssignments';
import { useNavigate } from 'react-router-dom';

interface AssignmentsTabContentProps {
  courseId: string;
  canManage: boolean;
  onAddAssignment?: () => void;
}

/**
 * Assignments Tab Content Component
 * 
 * This component is responsible for displaying the assignments tab in the course detail page.
 * It follows the Single Responsibility Principle by focusing only on assignment-related operations.
 */
const AssignmentsTabContent: React.FC<AssignmentsTabContentProps> = ({
  courseId,
  canManage,
  onAddAssignment
}) => {
  // State for notification messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Navigation
  const navigate = useNavigate();
  
  // Use our specialized hook for assignments management
  const { 
    assignments, 
    loading, 
    error,
    fetchAssignments,
    deleteAssignment
  } = useCourseAssignments(courseId);
  
  // Handler for showing notifications
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handler for navigating to an assignment
  const handleViewAssignment = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };
  
  // Handler for editing an assignment
  const handleEditAssignment = (assignmentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/assignments/edit/${assignmentId}`);
  };

  // Handler for deleting assignments
  const handleDeleteAssignment = async (assignmentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const result = await deleteAssignment(assignmentId);
    showNotification(
      result.success ? 'Assignment deleted successfully' : 'Failed to delete assignment',
      result.success ? 'success' : 'error'
    );
  };

  // Handler for refreshing assignments
  const handleRefresh = () => {
    fetchAssignments();
    showNotification('Assignments refreshed', 'success');
  };

  // Format due date
  const formatDueDate = (dateString: string | Date) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render loading state
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" align="center">Loading assignments...</Typography>
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="error" align="center">{error}</Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleRefresh}>
            Try Again
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      {/* Action buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
        >
          Refresh Assignments
        </Button>
        
        {canManage && onAddAssignment && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddAssignment}
          >
            Add Assignment
          </Button>
        )}
      </Box>

      {/* Assignments list */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        {assignments.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" color="textSecondary" align="center">
              No assignments available
            </Typography>
          </Box>
        ) : (
          <List>
            {assignments.map((assignment, index) => (
              <React.Fragment key={assignment.id}>
                <ListItem 
                  button 
                  onClick={() => handleViewAssignment(assignment.id)}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    },
                    py: 1.5  // Add vertical padding
                  }}
                >
                  <ListItemText
                    primary={assignment.title}
                    primaryTypographyProps={{
                      style: { 
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }
                    }}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          Due: {formatDueDate(assignment.dueDate)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {assignment.description}
                        </Typography>
                      </>
                    }
                  />
                  
                  {canManage && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={(e) => handleEditAssignment(assignment.id, e)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={(e) => handleDeleteAssignment(assignment.id, e)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                
                {index < assignments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignmentsTabContent; 