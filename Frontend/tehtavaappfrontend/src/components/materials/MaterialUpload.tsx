import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  CircularProgress
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { materialService } from '../../services/materials/materialService';
import { IMaterialCreateRequest } from '../../services/materials/materialTypes';

interface MaterialUploadProps {
  courseId: string | undefined;
  onUploadSuccess?: (response: { id: string; fileUrl: string; title?: string }) => void;
  buttonTitle?: string;
  showPreview?: boolean;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({ 
  courseId, 
  onUploadSuccess,
  buttonTitle
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file type
      const allowedTypes = [
        'application/pdf', 'text/plain', 'text/markdown', 'text/html',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only PDF, text, markdown, HTML, and common image formats (JPEG, PNG, GIF, WebP) are allowed.');
        return;
      }
      
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds the 50MB limit.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Valitse tiedosto');
      return;
    }

    if (!title.trim()) {
      setError('Anna materiaalille otsikko');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (selectedFile) formData.append('file', selectedFile);
      if (courseId) formData.append('courseId', courseId);
      
      // Upload the material using the appropriate method
      const uploadedMaterial = await materialService.createMaterialWithFormData(formData);
      
      setUploading(false);
      if (onUploadSuccess) {
        onUploadSuccess({ id: uploadedMaterial.id, fileUrl: uploadedMaterial.fileUrl || '', title: title });
      }
      resetForm();
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Tiedoston lähetys epäonnistui');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Upload Material
      </Typography>
      
      <Box component="form" noValidate sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
          error={error?.includes('Title')}
        />
        
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          required
          error={error?.includes('Description')}
          multiline
          rows={3}
        />
        
        <Box sx={{ mt: 3, mb: 2 }}>
          <input
            accept=".pdf,.txt,.md,.html,.jpg,.jpeg,.png,.gif,.webp"
            style={{ display: 'none' }}
            id="material-file-upload"
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <label htmlFor="material-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              sx={{ mr: 2 }}
            >
              Select File
            </Button>
          </label>
          
          {selectedFile && (
            <Typography variant="body2" component="span">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </Box>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {uploading ? 'Uploading...' : buttonTitle || 'Upload Material'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default MaterialUpload;
