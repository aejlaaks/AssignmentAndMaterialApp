import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Snackbar, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Group as GroupIcon 
} from '@mui/icons-material';
import { useCourseGroups } from '../../../hooks/useCourseGroups';
import { SchoolGroup } from '../../../interfaces/models/SchoolGroup';
import { Student } from '../../../interfaces/models/Student';

interface GroupsTabContentProps {
  courseId: string;
  canManage: boolean;
  onAddGroup?: () => void;
}

/**
 * Groups Tab Content Component
 * 
 * This component is responsible for displaying the groups tab in the course detail page.
 * It follows the Single Responsibility Principle by focusing only on group-related operations.
 */
const GroupsTabContent: React.FC<GroupsTabContentProps> = ({
  courseId,
  canManage,
  onAddGroup
}) => {
  // State for notification messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // State for group details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  
  // Use our specialized hook for groups management
  const { 
    groups, 
    loading, 
    error,
    selectedGroup,
    fetchGroups,
    deleteGroup,
    getGroupWithStudents,
    updateGroup,
    removeStudentFromGroup,
    removeCourseFromGroup
  } = useCourseGroups(courseId);
  
  // Debug useEffect to log when variables change
  useEffect(() => {
    if (detailsDialogOpen) {
      console.log("Group details dialog state:", { 
        canManage, 
        selectedGroup,
        detailsDialogOpen
      });
    }
  }, [detailsDialogOpen, canManage, selectedGroup]);
  
  // Handler for showing notifications
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handler for viewing group details
  const handleViewGroupDetails = async (groupId: string) => {
    const result = await getGroupWithStudents(groupId);
    if (result.success) {
      setSelectedGroupId(groupId);
      setDetailsDialogOpen(true);
      console.log("Group details dialog opened", { 
        canManage, 
        selectedGroup: result.group,
        groupId
      });
    } else {
      showNotification('Failed to load group details', 'error');
    }
  };
  
  // Handler for opening edit dialog
  const handleOpenEditDialog = (group: SchoolGroup, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
    setEditDialogOpen(true);
  };
  
  // Handler for saving group changes
  const handleSaveGroup = async () => {
    if (!selectedGroupId) return;
    
    const result = await updateGroup(selectedGroupId, {
      name: editGroupName,
      description: editGroupDescription
    });
    
    setEditDialogOpen(false);
    
    showNotification(
      result.success ? 'Group updated successfully' : 'Failed to update group',
      result.success ? 'success' : 'error'
    );
  };
  
  // Handler for opening delete dialog
  const handleOpenDeleteDialog = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedGroupId(groupId);
    setDeleteDialogOpen(true);
  };
  
  // Handler for deleting groups
  const handleDeleteGroup = async () => {
    if (!selectedGroupId) return;
    
    const result = await deleteGroup(selectedGroupId);
    setDeleteDialogOpen(false);
    
    showNotification(
      result.success ? 'Group deleted successfully' : 'Failed to delete group',
      result.success ? 'success' : 'error'
    );
  };

  // Handler for refreshing groups
  const handleRefresh = () => {
    fetchGroups();
    showNotification('Groups refreshed', 'success');
  };

  // Handler for removing a course from a group
  const handleRemoveCourseFromGroup = async (groupId: string) => {
    if (!courseId) return;
    
    if (window.confirm(`Are you sure you want to remove this course from the group?`)) {
      const result = await removeCourseFromGroup(groupId, courseId);
      
      if (result.success) {
        showNotification('Course removed from group successfully', 'success');
        setDetailsDialogOpen(false);
        await fetchGroups();
      } else {
        showNotification(`Failed to remove course: ${result.message}`, 'error');
      }
    }
  };

  // Handler for removing a student from a group
  const handleRemoveStudentFromGroup = async (groupId: string, studentId: string) => {
    if (window.confirm(`Are you sure you want to remove this student from the group?`)) {
      const result = await removeStudentFromGroup(groupId, studentId);
      
      if (result.success) {
        showNotification('Student removed from group successfully', 'success');
        await getGroupWithStudents(groupId);
      } else {
        showNotification(`Failed to remove student: ${result.message}`, 'error');
      }
    }
  };

  // Render loading state
  if (loading && groups.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" align="center">Loading groups...</Typography>
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
          Refresh Groups
        </Button>
        
        {canManage && onAddGroup && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddGroup}
          >
            Add Group
          </Button>
        )}
      </Box>

      {/* Groups list */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        {groups.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" color="textSecondary" align="center">
              No groups available
            </Typography>
          </Box>
        ) : (
          <List>
            {groups.map((group, index) => (
              <React.Fragment key={group.id}>
                <ListItem 
                  button 
                  onClick={() => handleViewGroupDetails(group.id)}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    } 
                  }}
                >
                  <ListItemText
                    primary={group.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          Students: {group.studentCount || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {group.description || 'No description'}
                        </Typography>
                      </>
                    }
                  />
                  
                  {canManage && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={(e) => handleOpenEditDialog(group, e)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={(e) => handleOpenDeleteDialog(group.id, e)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                
                {index < groups.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Group Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedGroup?.name || 'Group Details'}</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>Loading group details...</Typography>
            </Box>
          ) : selectedGroup ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Description: {selectedGroup.description || 'No description'}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Students: {selectedGroup.students?.length || 0}
              </Typography>
              
              {selectedGroup.students && selectedGroup.students.length > 0 ? (
                <List>
                  {selectedGroup.students.map((student) => (
                    <ListItem key={student.id}>
                      <ListItemText
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={student.email}
                      />
                      
                      {canManage && (
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="remove" 
                            onClick={() => handleRemoveStudentFromGroup(selectedGroup.id, student.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">No students in this group</Typography>
              )}
            </>
          ) : (
            <Typography variant="body1">Failed to load group details</Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          {canManage && selectedGroup && (
            <>
              <Button 
                onClick={() => handleRemoveCourseFromGroup(selectedGroup.id)} 
                color="error"
                startIcon={<DeleteIcon />}
              >
                Remove from Course
              </Button>
              <Button 
                onClick={(e) => {
                  handleOpenEditDialog(selectedGroup, e as React.MouseEvent<HTMLButtonElement>);
                  setDetailsDialogOpen(false);
                }} 
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit Group
              </Button>
            </>
          )}
          <Button onClick={() => setDetailsDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      >
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Group Name"
              fullWidth
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveGroup} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this group? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteGroup} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default GroupsTabContent; 