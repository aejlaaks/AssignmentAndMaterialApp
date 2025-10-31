import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Card, IconButton, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Typography, CircularProgress } from '@mui/material';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MarkdownRenderer from './MarkdownRenderer';
import { fileUploadService } from '../../services/fileUploadService';
import '../../styles/markdown.css';
import { getFixedImageUrl } from '../../utils/imageUtils';

// Interface for the markdown editor props
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  label?: string;
  previewMode?: boolean;
  showFileUpload?: boolean;
  showToolbar?: boolean;
  uploadPath?: string;
  showTooltips?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Icon button props interface
interface IconButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  showTooltips?: boolean;
}

// Implement the AskDialog component inline
interface AskDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onConfirm: (value: string, secondaryValue?: string) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  showTextField?: boolean;
  textFieldLabel?: string;
  textFieldValue?: string;
  showSecondaryTextField?: boolean;
  secondaryTextFieldLabel?: string;
  secondaryTextFieldValue?: string;
}

const AskDialog: React.FC<AskDialogProps> = ({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  showTextField = false,
  textFieldLabel = '',
  textFieldValue = '',
  showSecondaryTextField = false,
  secondaryTextFieldLabel = '',
  secondaryTextFieldValue = ''
}) => {
  const [value, setValue] = useState(textFieldValue);
  const [secondaryValue, setSecondaryValue] = useState(secondaryTextFieldValue);

  const handleConfirm = () => {
    onConfirm(value, secondaryValue);
    setValue('');
    setSecondaryValue('');
  };

  const handleClose = () => {
    onClose();
    setValue('');
    setSecondaryValue('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description && <Typography variant="body1" gutterBottom>{description}</Typography>}
        
        {showTextField && (
          <TextField
            autoFocus
            margin="dense"
            label={textFieldLabel}
            fullWidth
            value={value}
            onChange={(e) => setValue(e.target.value)}
            variant="outlined"
          />
        )}
        
        {showSecondaryTextField && (
          <TextField
            margin="dense"
            label={secondaryTextFieldLabel}
            fullWidth
            value={secondaryValue}
            onChange={(e) => setSecondaryValue(e.target.value)}
            variant="outlined"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{cancelLabel}</Button>
        <Button onClick={handleConfirm} variant="contained">{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
};

// Implement the FileUpload component inline
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  children: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = 'image/*', 
  children 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleChange}
        accept={accept}
      />
    </>
  );
};

// Real file upload function that uses the existing fileUploadService
const uploadFile = async (file: File, uploadPath: string): Promise<{ url: string }> => {
  try {
    // Use the existing file upload service with the 'markdown-images' folder
    const uploadedFile = await fileUploadService.uploadFile(file, 'markdown-images');
    return { url: uploadedFile.fileUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Markdown editor component with preview functionality
 */
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write in markdown...',
  minRows = 5,
  label = 'Content',
  previewMode = false,
  showFileUpload = true,
  showToolbar = true,
  uploadPath = '/api/uploads',
  showTooltips = true,
  disabled = false,
  error = false,
  helperText = '',
  onBlur,
  onFocus
}) => {
  // Internal state
  const [mode, setMode] = useState<'edit' | 'preview'>(previewMode ? 'preview' : 'edit');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  // Handle text selection changes
  const handleSelectionChange = () => {
    if (textFieldRef.current) {
      setSelectionStart(textFieldRef.current.selectionStart);
      setSelectionEnd(textFieldRef.current.selectionEnd);
    }
  };

  // Insert text at cursor position
  const insertText = useCallback((before: string, after: string = '') => {
    if (textFieldRef.current) {
      const start = selectionStart;
      const end = selectionEnd;
      const selectedText = value.substring(start, end);
      const newText = before + selectedText + after;
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
      
      // Focus back to the editor and restore selection (adjusted for the new content)
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
          textFieldRef.current.setSelectionRange(
            start + before.length,
            end + before.length
          );
        }
      }, 50);
    }
  }, [value, onChange, selectionStart, selectionEnd]);

  // Format actions
  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatBulletList = () => insertText('\n- ');
  const formatNumberList = () => insertText('\n1. ');
  const formatCode = () => {
    // If it's a multiline selection, use code block, otherwise use inline code
    if (value.substring(selectionStart, selectionEnd).includes('\n')) {
      insertText('\n```\n', '\n```\n');
    } else {
      insertText('`', '`');
    }
  };
  
  // Graph and diagram formatting
  const formatDotDiagram = () => {
    insertText('\n```dot\ndigraph G {\n    // Add your graphviz code here\n    A -> B;\n}\n```\n');
  };

  // Handle image insertion
  const handleImageInsert = useCallback((imageUrl: string) => {
    console.log(`Handling image insert for URL: ${imageUrl}`);
    
    // Check if this is a blob storage URL that needs fixing
    if (imageUrl.includes('tehtavatblocproduction.blob.core.windows.net')) {
      const fixedUrl = getFixedImageUrl(imageUrl);
      console.log(`Fixed blob storage URL in editor: ${imageUrl} -> ${fixedUrl}`);
      insertText(`![Image](${fixedUrl})`);
    } else {
      insertText(`![Image](${imageUrl})`);
    }
    setShowImageDialog(false);
  }, [insertText]);

  // Handle link insertion
  const handleLinkInsert = (url: string, text: string) => {
    insertText(`[${text}](${url})`);
    setShowLinkDialog(false);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const response = await uploadFile(file, uploadPath);
      console.log(`File uploaded, raw URL: ${response.url}`);
      
      // Check if this is a blob storage URL that needs fixing
      const imageUrl = response.url.includes('tehtavatblocproduction.blob.core.windows.net') 
        ? getFixedImageUrl(response.url) 
        : response.url;
        
      console.log(`Using URL for image insertion: ${imageUrl}`);
      handleImageInsert(imageUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      // You could add an error notification here
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle paste event for images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste action for images
        
        const file = items[i].getAsFile();
        if (file) {
          try {
            setIsUploading(true);
            
            // Create a more descriptive filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileExt = file.name && file.name.includes('.') 
              ? file.name.split('.').pop() 
              : file.type.split('/')[1] || 'png';
              
            const renamedFile = new File(
              [file], 
              `pasted-image-${timestamp}.${fileExt}`,
              { type: file.type }
            );
            
            // Use the existing upload function
            const response = await uploadFile(renamedFile, uploadPath);
            console.log(`Pasted image uploaded, raw URL: ${response.url}`);
            
            // Check if this is a blob storage URL that needs fixing
            const imageUrl = response.url.includes('tehtavatblocproduction.blob.core.windows.net') 
              ? getFixedImageUrl(response.url) 
              : response.url;
              
            console.log(`Using URL for pasted image insertion: ${imageUrl}`);
            handleImageInsert(imageUrl);
          } catch (error) {
            console.error('Error handling pasted image:', error);
            // Optionally show an error notification
          } finally {
            setIsUploading(false);
          }
        }
        break;
      }
    }
  }, [uploadPath, handleImageInsert]);

  // Custom toolbar button component
  const ToolbarButton: React.FC<IconButtonProps> = ({ title, icon, onClick, showTooltips }) => {
    return showTooltips ? (
      <Tooltip title={title}>
        <IconButton onClick={onClick} size="small" disabled={disabled}>
          {icon}
        </IconButton>
      </Tooltip>
    ) : (
      <IconButton onClick={onClick} size="small" disabled={disabled}>
        {icon}
      </IconButton>
    );
  };

  // More toolbar items menu
  const renderMoreToolbarItems = () => {
    return (
      <>
        <ToolbarButton
          title="GraphViz Diagram"
          icon={<CodeIcon fontSize="small" />}
          onClick={formatDotDiagram}
          showTooltips={showTooltips}
        />
      </>
    );
  };

  // The editor toolbar
  const renderToolbar = () => {
    if (!showToolbar) return null;
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
        <ToolbarButton
          title="Bold"
          icon={<FormatBoldIcon fontSize="small" />}
          onClick={formatBold}
          showTooltips={showTooltips}
        />
        <ToolbarButton
          title="Italic"
          icon={<FormatItalicIcon fontSize="small" />}
          onClick={formatItalic}
          showTooltips={showTooltips}
        />
        <ToolbarButton
          title="Bullet List"
          icon={<FormatListBulletedIcon fontSize="small" />}
          onClick={formatBulletList}
          showTooltips={showTooltips}
        />
        <ToolbarButton
          title="Numbered List"
          icon={<FormatListNumberedIcon fontSize="small" />}
          onClick={formatNumberList}
          showTooltips={showTooltips}
        />
        <ToolbarButton
          title="Code"
          icon={<CodeIcon fontSize="small" />}
          onClick={formatCode}
          showTooltips={showTooltips}
        />
        <ToolbarButton
          title="Link"
          icon={<LinkIcon fontSize="small" />}
          onClick={() => setShowLinkDialog(true)}
          showTooltips={showTooltips}
        />
        {showFileUpload && (
          <FileUpload onFileSelect={handleFileUpload}>
            <ToolbarButton
              title="Upload Image"
              icon={<InsertPhotoIcon fontSize="small" />}
              onClick={() => {}}
              showTooltips={showTooltips}
            />
          </FileUpload>
        )}
        <ToolbarButton
          title="More"
          icon={<MoreHorizIcon fontSize="small" />}
          onClick={() => {}}
          showTooltips={showTooltips}
        />
        {renderMoreToolbarItems()}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          size="small"
          onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          variant="outlined"
        >
          {mode === 'edit' ? 'Preview' : 'Edit'}
        </Button>
      </Box>
    );
  };

  // Markdown Editor or Preview based on mode
  return (
    <Box sx={{ position: 'relative' }}>
      {renderToolbar()}
      
      {/* Loading indicator */}
      {isUploading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '4px 8px',
            borderRadius: 1,
            zIndex: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <CircularProgress size={16} />
          <Box sx={{ fontSize: '0.8rem' }}>Uploading image...</Box>
        </Box>
      )}
      
      {mode === 'edit' ? (
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          onPaste={handlePaste}
          minRows={minRows}
          maxRows={20}
          placeholder={placeholder}
          variant="outlined"
          disabled={disabled || isUploading}
          error={error}
          helperText={helperText}
          onBlur={onBlur}
          onFocus={onFocus}
          sx={{ fontFamily: 'monospace' }}
        />
      ) : (
        <Card variant="outlined" sx={{ p: 2, minHeight: `${minRows * 1.5}rem` }}>
          <MarkdownRenderer>{value}</MarkdownRenderer>
        </Card>
      )}
      
      {/* Image Dialog */}
      <AskDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        title="Insert Image"
        description="Enter the image URL"
        onConfirm={handleImageInsert}
        confirmLabel="Insert"
        showTextField
        textFieldLabel="Image URL"
      />
      
      {/* Link Dialog */}
      <AskDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        title="Insert Link"
        description="Enter the link URL and text"
        onConfirm={(url: string, text?: string) => handleLinkInsert(url, text || 'link')}
        confirmLabel="Insert"
        showTextField
        textFieldLabel="URL"
        showSecondaryTextField
        secondaryTextFieldLabel="Link Text"
        secondaryTextFieldValue={value.substring(selectionStart, selectionEnd)}
      />
    </Box>
  );
};

export default MarkdownEditor; 