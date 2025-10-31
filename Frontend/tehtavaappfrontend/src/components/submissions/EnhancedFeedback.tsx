import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Grid,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FeedbackAttachment } from '../../services/feedbackService';
import RichTextEditor from '../common/RichTextEditor';

interface EnhancedFeedbackProps {
  initialFeedback: string;
  isRichText: boolean;
  attachments: FeedbackAttachment[];
  readOnly?: boolean;
  onFeedbackChange: (feedback: string, isRichText: boolean) => void;
  onAttachmentAdd: (file: File, description: string) => Promise<FeedbackAttachment>;
  onAttachmentRemove: (attachmentId: string) => Promise<boolean>;
}

const EnhancedFeedback: React.FC<EnhancedFeedbackProps> = ({
  initialFeedback,
  isRichText,
  attachments,
  readOnly = false,
  onFeedbackChange,
  onAttachmentAdd,
  onAttachmentRemove
}) => {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [useRichText, setUseRichText] = useState(isRichText);
  const [attachmentsList, setAttachmentsList] = useState<FeedbackAttachment[]>(attachments);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
    onFeedbackChange(value, useRichText);
  };

  const handleRichTextToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setUseRichText(newValue);
    onFeedbackChange(feedback, newValue);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setOpenUploadDialog(true);
    }
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setFileDescription('');
    setSelectedFile(null);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setUploadLoading(true);
      const newAttachment = await onAttachmentAdd(selectedFile, fileDescription);
      setAttachmentsList([...attachmentsList, newAttachment]);
      handleCloseUploadDialog();
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      setDeleteLoading(attachmentId);
      const success = await onAttachmentRemove(attachmentId);
      if (success) {
        setAttachmentsList(attachmentsList.filter(a => a.id !== attachmentId));
      }
    } catch (err) {
      console.error('Error removing attachment:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    } else if (fileType === 'application/pdf') {
      return <PictureAsPdfIcon />;
    } else if (fileType.includes('document') || fileType.includes('text')) {
      return <DescriptionIcon />;
    } else {
      return <InsertDriveFileIcon />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Feedback</Typography>
        {!readOnly && (
          <FormControlLabel
            control={
              <Switch
                checked={useRichText}
                onChange={handleRichTextToggle}
                color="primary"
              />
            }
            label="Rich Text"
          />
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {useRichText ? (
        <RichTextEditor
          initialValue={feedback}
          onChange={handleFeedbackChange}
          readOnly={readOnly}
          placeholder="Enter your feedback here..."
          minHeight={200}
        />
      ) : (
        <TextField
          fullWidth
          multiline
          rows={6}
          value={feedback}
          onChange={(e) => handleFeedbackChange(e.target.value)}
          placeholder="Enter your feedback here..."
          disabled={readOnly}
          variant="outlined"
        />
      )}

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Attachments</Typography>
          {!readOnly && (
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={handleOpenFileDialog}
              size="small"
            >
              Add Attachment
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {attachmentsList.length > 0 ? (
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
            <List dense>
              {attachmentsList.map((attachment) => (
                <ListItem
                  key={attachment.id || ''}
                  button
                  component="a"
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ListItemText
                    primary={attachment.fileName}
                    secondary={
                      <>
                        {attachment.description && (
                          <Typography variant="body2" component="span" display="block">
                            {attachment.description}
                          </Typography>
                        )}
                        <Typography variant="caption" component="span" color="text.secondary">
                          {formatFileSize(attachment.fileSize)}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ style: { display: 'flex', alignItems: 'center' } }}
                    sx={{ mr: 2 }}
                  />
                  {getFileIcon(attachment.fileType)}
                  {!readOnly && (
                    <ListItemSecondaryAction>
                      <Tooltip title="Poista liite">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (attachment.id) {
                              handleRemoveAttachment(attachment.id);
                            }
                          }}
                          disabled={attachment.id ? deleteLoading === attachment.id : false}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2, textAlign: 'center' }}>
            No attachments added yet.
          </Typography>
        )}
      </Box>

      {/* File Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog}>
        <DialogTitle>Add Attachment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2">
                Selected file: {selectedFile?.name} ({selectedFile ? formatFileSize(selectedFile.size) : ''})
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Description (optional)"
                fullWidth
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUploadFile} 
            color="primary" 
            disabled={uploadLoading || !selectedFile}
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedFeedback; 