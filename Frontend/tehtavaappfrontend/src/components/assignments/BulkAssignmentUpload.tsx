import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { assignmentService } from '../../services/assignments/assignmentService';
import { fileUploadService } from '../../services/fileUploadService';

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FileWithPreview {
  file: File;
  name: string;
  size: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  assignmentId?: number;
}

interface BulkAssignmentUploadProps {
  courseId: string;
  onComplete?: () => void; // Callback to refresh assignments list after upload completes
}

const BulkAssignmentUpload: React.FC<BulkAssignmentUploadProps> = ({ courseId, onComplete }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for assignment name
        size: formatFileSize(file.size),
        status: 'pending' as const,
      }));
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      setUploadError(null);
      setUploadSuccess(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError('No files selected');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    let successCount = 0;
    const totalFiles = files.length;

    // Create a copy of files to update status
    const updatedFiles = [...files];

    for (let i = 0; i < totalFiles; i++) {
      // Update current file status to uploading
      updatedFiles[i] = { ...updatedFiles[i], status: 'uploading' };
      setFiles([...updatedFiles]);

      try {
        // Create assignment
        const assignmentName = updatedFiles[i].name;
        const assignmentData = {
          title: assignmentName,
          courseId: courseId,
          description: `Assignment created via bulk upload: ${assignmentName}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default due date: 1 week from now
          points: 100, // Default max points
        };

        // Create the assignment
        const assignment = await assignmentService.createAssignment(assignmentData);

        if (assignment && assignment.id) {
          // Upload the file as an attachment
          try {
            // Rename the file to include the assignment ID for better tracking
            const originalFileName = updatedFiles[i].file.name;
            const fileExtension = originalFileName.split('.').pop();
            const fileNameWithoutExtension = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
            
            // Create a new file with renamed filename including assignment ID
            const renamedFile = new File(
              [updatedFiles[i].file], 
              `${fileNameWithoutExtension}_assignment-${assignment.id}.${fileExtension}`, 
              { type: updatedFiles[i].file.type }
            );
            
            console.log(`Uploading file for assignment ${assignment.id}:`, renamedFile.name);
            
            // Use the new method that explicitly associates the file with the assignment
            // and passes the courseId parameter
            const uploadResponse = await fileUploadService.uploadFileForAssignment(
              renamedFile, 
              parseInt(assignment.id, 10), // Ensure assignment.id is converted to number
              'assignments', // folder
              courseId // Pass the courseId to ensure proper association
            );
            
            if (uploadResponse && uploadResponse.id) {
              // Update file status to success
              updatedFiles[i] = { 
                ...updatedFiles[i], 
                status: 'success', 
                assignmentId: parseInt(assignment.id, 10) // Ensure assignment.id is converted to number
              };
              successCount++;
            } else {
              // Update file status to error
              updatedFiles[i] = { 
                ...updatedFiles[i], 
                status: 'error', 
                error: 'Failed to upload attachment' 
              };
            }
          } catch (uploadError) {
            // Update file status to error
            updatedFiles[i] = { 
              ...updatedFiles[i], 
              status: 'error', 
              error: uploadError instanceof Error ? uploadError.message : 'Failed to upload attachment' 
            };
            console.error(`Error uploading attachment for assignment ${assignmentName}:`, uploadError);
          }
        } else {
          // Update file status to error
          updatedFiles[i] = { 
            ...updatedFiles[i], 
            status: 'error', 
            error: 'Failed to create assignment' 
          };
        }
      } catch (error) {
        // Update file status to error
        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
        console.error(`Error creating assignment ${updatedFiles[i].name}:`, error);
      }

      // Update progress
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      setFiles([...updatedFiles]);
    }

    setUploading(false);
    
    if (successCount === totalFiles) {
      setUploadSuccess(true);
    } else if (successCount === 0) {
      setUploadError('All uploads failed');
    } else {
      setUploadError(`${successCount} of ${totalFiles} assignments created successfully`);
    }

    if (onComplete) {
      onComplete();
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Assignment Upload
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Upload multiple files to create assignments. Each file will be used to create a new assignment with the filename as the assignment name.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.zip,.rar,.ppt,.pptx,.xls,.xlsx"
        />
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Select Files
        </Button>
        
        {files.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearAll}
            sx={{ ml: 2 }}
            disabled={uploading}
          >
            Clear All
          </Button>
        )}
      </Box>

      {files.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 400, overflow: 'auto' }}>
          <List>
            {files.map((file, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" component="span">
                          {file.size}
                        </Typography>
                        {file.status === 'uploading' && (
                          <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                        {file.status === 'success' && (
                          <Chip 
                            icon={<CheckIcon />} 
                            label="Success" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                        {file.status === 'error' && (
                          <Chip 
                            icon={<ErrorIcon />} 
                            label={file.error || 'Error'} 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading || file.status === 'success'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {uploadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          All assignments created successfully!
        </Alert>
      )}

      {files.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : undefined}
          >
            {uploading ? `Uploading (${uploadProgress}%)` : 'Create Assignments'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BulkAssignmentUpload; 