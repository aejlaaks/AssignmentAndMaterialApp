import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  CircularProgress, 
  Alert, 
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Send as SendIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { submissionService, ICreateSubmissionRequest, ISubmissionUpdate } from '../../../services/assignments/submissionService';
import { useAuth } from '../../../hooks/useAuth';
import { formatBytes } from '../../../utils/fileUtils';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum number of files
const MAX_FILES = 5;

interface SubmissionCreatorProps {
  assignmentId: string;
  existingSubmissionId?: string;
  initialContent?: string;
  onSubmissionComplete?: (submissionId: string) => void;
  onCancel?: () => void;
}

const SubmissionCreator: React.FC<SubmissionCreatorProps> = ({
  assignmentId,
  existingSubmissionId,
  initialContent = '',
  onSubmissionComplete,
  onCancel
}) => {
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditMode = !!existingSubmissionId;
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    
    // Convert FileList to array
    const newFiles = Array.from(fileList);
    
    // Check file size
    const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Tiedostot ylittävät maksimikoon (${formatBytes(MAX_FILE_SIZE)}): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Check if adding these files would exceed the maximum
    if (files.length + newFiles.length > MAX_FILES) {
      setError(`Voit lisätä enintään ${MAX_FILES} tiedostoa.`);
      return;
    }
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && files.length === 0) {
      setError('Lisää tekstiä tai tiedostoja ennen palautusta.');
      return;
    }
    
    if (!user) {
      setError('Kirjaudu sisään tehdäksesi palautuksen.');
      return;
    }
    
    // Validate assignment ID
    if (!assignmentId || isNaN(parseInt(assignmentId, 10))) {
      setError('Virheellinen tehtävän tunniste. Varmista, että olet oikealla sivulla.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      let submissionId: string;
      
      if (isEditMode && existingSubmissionId) {
        // Update existing submission
        try {
          // Ensure ID is a valid number
          const numericId = parseInt(existingSubmissionId, 10);
          
          if (isNaN(numericId)) {
            throw new Error(`Invalid submission ID: ${existingSubmissionId}`);
          }
          
          // Create the update data with all required fields
          const updateData = {
            id: existingSubmissionId,
            content: content,
            feedback: "",
            status: "submitted" as const
          };
          
          console.log('Sending update data:', updateData);
          const updatedSubmission = await submissionService.updateSubmission(updateData);
          
          // Note: In a real implementation, we would need to add file upload support
          // for existing submissions, but that would require backend changes
          
          submissionId = updatedSubmission.id;
          setSuccessMessage('Palautus päivitetty onnistuneesti!');
        } catch (err) {
          console.error('Virhe palautuksen päivityksessä:', err);
          if (axios.isAxiosError(err) && err.response) {
            console.error('Response data:', JSON.stringify(err.response.data));
            console.error('Response status:', err.response.status);
            console.error('Response headers:', JSON.stringify(err.response.headers));
            setError(`Palautuksen päivittäminen epäonnistui: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
          } else {
            setError('Palautuksen päivittäminen epäonnistui. Tarkista, että ID on kelvollinen numero.');
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new submission
        const submissionData: ICreateSubmissionRequest = {
          assignmentId,
          content,
          files: files.length > 0 ? files : undefined
        };
        
        try {
          console.log('Submitting to assignment ID:', assignmentId);
          const newSubmission = await submissionService.createSubmission(submissionData);
          submissionId = newSubmission.id;
          setSuccessMessage('Palautus lähetetty onnistuneesti!');
        } catch (err) {
          console.error('Virhe palautuksen lähettämisessä:', err);
          let errorMessage = 'Palautuksen lähettäminen epäonnistui. ';
          
          if (axios.isAxiosError(err) && err.response) {
            if (err.response.status === 404) {
              errorMessage += 'Tehtävää ei löydy. Varmista, että tehtävä on olemassa.';
            } else if (err.response.status === 500) {
              errorMessage += 'Palvelimella tapahtui virhe. Yritä myöhemmin uudelleen.';
            } else {
              errorMessage += `Virhe: ${err.response.status}`;
              
              if (err.response.data && err.response.data.error) {
                errorMessage += ` - ${err.response.data.error}`;
              }
            }
          } else if (err instanceof Error) {
            errorMessage += err.message;
          }
          
          setError(errorMessage);
          setIsSubmitting(false);
          return;
        }
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
      
      let errorMessage = 'Palautuksen lähettäminen epäonnistui. ';
      if (err instanceof Error) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Yritä uudelleen.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
              label="Palautuksen sisältö"
              multiline
              rows={8}
              fullWidth
              value={content}
              onChange={handleContentChange}
              placeholder="Kirjoita palautuksesi tähän..."
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Liitetiedostot ({files.length}/{MAX_FILES})
            </Typography>
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.paper',
                mb: 2
              }}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                disabled={isSubmitting}
              />
              <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography>
                Klikkaa valitaksesi tiedostot
              </Typography>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || files.length >= MAX_FILES}
                sx={{ mt: 2 }}
              >
                Valitse tiedostot
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Sallitut tiedostotyypit: PDF, Word, Excel, PowerPoint, teksti, kuvat, ZIP
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Maksimikoko: {formatBytes(MAX_FILE_SIZE)}
              </Typography>
            </Box>
            
            {files.length > 0 && (
              <>
                {!isEditMode && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Tiedostojen lataus ei ole tällä hetkellä tuettu. Vain tekstipalautus tallennetaan.
                  </Alert>
                )}
                <List>
                  {files.map((file, index) => (
                    <ListItem key={index} divider={index < files.length - 1}>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={formatBytes(file.size)}
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
              </>
            )}
          </Grid>
          
          {isSubmitting && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Lähetetään palautusta...
                </Typography>
                <LinearProgress />
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : isEditMode ? <SaveIcon /> : <SendIcon />}
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
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SubmissionCreator; 