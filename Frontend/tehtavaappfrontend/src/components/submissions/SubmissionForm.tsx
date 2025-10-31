import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert, 
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { submissionService, validateSubmissionData, validateFileUploads } from '../../services/submission';
import { getSubmissionErrorMessage } from '../../services/submission/submissionUtils';

interface SubmissionFormProps {
  assignmentId: string;
  existingSubmissionId?: string;
  initialContent?: string;
  onSubmissionComplete?: (submissionId: string) => void;
  onCancel?: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  assignmentId,
  existingSubmissionId,
  initialContent = '',
  onSubmissionComplete,
  onCancel
}) => {
  // State for form data
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState<File[]>([]);
  
  // State for UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Determine if we're in edit mode
  const isEditMode = Boolean(existingSubmissionId);
  
  // Load existing submission if in edit mode
  useEffect(() => {
    if (isEditMode && existingSubmissionId) {
      const loadSubmission = async () => {
        try {
          const submission = await submissionService.getSubmission(existingSubmissionId);
          setContent(submission.submissionText || '');
        } catch (err) {
          setError(getSubmissionErrorMessage(err, 'loading submission'));
        }
      };
      
      loadSubmission();
    }
  }, [isEditMode, existingSubmissionId]);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      
      // Validate files
      const validation = validateFileUploads([...files, ...newFiles], MAX_FILES, MAX_FILE_SIZE_MB);
      if (validation !== true) {
        setError(validation);
        return;
      }
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  // Remove a file from the list
  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate submission content
    const validation = validateSubmissionData(content);
    if (validation !== true) {
      setError(validation);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let submissionId: string;
      
      if (isEditMode && existingSubmissionId) {
        // Update existing submission
        const updated = await submissionService.updateSubmission(existingSubmissionId, {
          id: existingSubmissionId,
          content
        });
        
        submissionId = updated.id;
        setSuccessMessage('Palautus päivitetty onnistuneesti!');
      } else {
        // Create new submission
        const newSubmission = await submissionService.createSubmission({
          assignmentId,
          content,
          files
        });
        
        submissionId = newSubmission.id;
        setSuccessMessage('Palautus lähetetty onnistuneesti!');
      }
      
      // Call the completion callback
      if (onSubmissionComplete) {
        onSubmissionComplete(submissionId);
      }
      
      // Reset form after successful submission
      if (!isEditMode) {
        setContent('');
        setFiles([]);
      }
    } catch (err) {
      console.error('Virhe palautuksen lähettämisessä:', err);
      setError(getSubmissionErrorMessage(err, 'submission'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle closing snackbar
  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Muokkaa palautusta' : 'Lähetä palautus'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Palautusteksti"
              multiline
              rows={6}
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              required
              placeholder="Kirjoita palautusteksti tähän..."
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Liitetiedostot ({files.length}/{MAX_FILES})
              </Typography>
              
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload-button"
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isSubmitting || files.length >= MAX_FILES}
              />
              
              <label htmlFor="file-upload-button">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  disabled={isSubmitting || files.length >= MAX_FILES}
                >
                  Lisää tiedostoja
                </Button>
              </label>
              
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Maksimikoko: {MAX_FILE_SIZE_MB} MB per tiedosto
              </Typography>
            </Box>
            
            {files.length > 0 && (
              <List>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isSubmitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {isSubmitting && files.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Lähetetään tiedostoja... {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Peruuta
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || !content.trim()}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting
                  ? 'Lähetetään...'
                  : isEditMode
                    ? 'Tallenna muutokset'
                    : 'Lähetä palautus'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      <Snackbar
        open={Boolean(error) || Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        {error ? (
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        ) : successMessage ? (
          <Alert onClose={handleCloseSnackbar} severity="success">
            {successMessage}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ display: 'none' }}>
            Placeholder
          </Alert>
        )}
      </Snackbar>
    </Paper>
  );
};

export default SubmissionForm; 