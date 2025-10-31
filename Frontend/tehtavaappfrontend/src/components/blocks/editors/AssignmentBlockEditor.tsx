import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Divider
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { AssignmentBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import { assignmentService } from '../../../services/assignments/assignmentService';
import { fileUploadService } from '../../../services/fileUploadService';

/**
 * Editor component for assignment blocks
 */
export const AssignmentBlockEditor: React.FC<BlockEditorProps<AssignmentBlock>> = ({
  block,
  courseId,
  onChange,
  onValidityChange
}) => {
  // State variables
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(block?.assignmentId || '');
  const [availableAssignments, setAvailableAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  
  // Refs
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);
  
  // Update validity when fields change
  useEffect(() => {
    if (onValidityChange) {
      // Assignment blocks are valid when they have a selected assignment
      const isValid = !!selectedAssignmentId;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ assignmentId: selectedAssignmentId });
    }
  }, [selectedAssignmentId, onChange, onValidityChange]);

  // Fetch assignments when component mounts
  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  // Fetch available assignments
  const fetchAssignments = async () => {
    if (!courseId) {
      return;
    }
    
    try {
      setLoadingAssignments(true);
      
      const assignments = await assignmentService.getAssignmentsByCourse(courseId);
      setAvailableAssignments(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAvailableAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Handle file selection
  const handleAssignmentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAssignmentFiles(prev => [...prev, ...newFiles]);
      
      // Reset the file input
      if (assignmentFileInputRef.current) {
        assignmentFileInputRef.current.value = '';
      }
    }
  };

  // Remove a file from the list
  const handleRemoveAssignmentFile = (index: number) => {
    setAssignmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload assignment files
  const handleUploadAssignmentFiles = async () => {
    if (!selectedAssignmentId || assignmentFiles.length === 0) {
      return;
    }
    
    try {
      setUploadingFiles(true);
      
      const uploadPromises = assignmentFiles.map(async (file) => {
        try {
          // Use the fileUploadService to upload the file
          const uploadResponse = await fileUploadService.uploadFileForAssignment(
            file,
            parseInt(selectedAssignmentId),
            'assignments',
            courseId
          );
          
          console.log('File uploaded:', uploadResponse);
          return true;
        } catch (e) {
          console.error(`Error uploading file ${file.name}:`, e);
          return false;
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(Boolean).length;
      
      console.log(`Successfully uploaded ${successfulUploads} of ${assignmentFiles.length} files`);
      
      // Clear files after upload
      setAssignmentFiles([]);
    } catch (error) {
      console.error('Error uploading assignment files:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="assignment-select-label">Assignment</InputLabel>
        <Select
          labelId="assignment-select-label"
          id="assignment-select"
          value={selectedAssignmentId}
          label="Assignment"
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
          disabled={loadingAssignments}
        >
          {loadingAssignments ? (
            <MenuItem value="" disabled>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading assignments...
              </Box>
            </MenuItem>
          ) : availableAssignments.length === 0 ? (
            <MenuItem value="" disabled>
              No assignments available - create one first
            </MenuItem>
          ) : (
            availableAssignments.map((assignment) => (
              <MenuItem key={assignment.id} value={assignment.id}>
                {assignment.title}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      
      {selectedAssignmentId && availableAssignments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Selected Assignment:</Typography>
          {availableAssignments
            .filter(a => a.id === selectedAssignmentId)
            .map(assignment => (
              <Box key={assignment.id} sx={{ mt: 1 }}>
                <Typography variant="body1">{assignment.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {assignment.description || 'No description'}
                </Typography>
                {assignment.dueDate && (
                  <Typography variant="body2" color="text.secondary">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            ))
          }
        </Box>
      )}
      
      {selectedAssignmentId && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Upload Assignment Files
          </Typography>
          
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleAssignmentFileSelect}
            ref={assignmentFileInputRef}
          />
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => assignmentFileInputRef.current?.click()}
            disabled={uploadingFiles}
            sx={{ mb: 2 }}
          >
            Select Files
          </Button>
          
          {assignmentFiles.length > 0 && (
            <>
              <List dense>
                {assignmentFiles.map((file, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveAssignmentFile(index)}
                        disabled={uploadingFiles}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadAssignmentFiles}
                disabled={uploadingFiles || assignmentFiles.length === 0}
                startIcon={uploadingFiles ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              >
                {uploadingFiles ? 'Uploading...' : 'Upload Files'}
              </Button>
            </>
          )}
        </>
      )}
      
      {!courseId && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          A course ID is required to load assignments. Please make sure you are editing content for a specific course.
        </Alert>
      )}
    </Box>
  );
}; 