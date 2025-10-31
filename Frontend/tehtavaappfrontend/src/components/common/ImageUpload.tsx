import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress,
  Alert
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { uploadImage, IUploadedImage } from '../../services/materials/imageService';

interface UploadResponse {
  id: string;
  fileUrl: string;
  title?: string;
}

interface ImageUploadProps {
  courseId?: string;
  onUploadSuccess: (response: UploadResponse) => void;
  onUploadError: (error: any) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  courseId, 
  onUploadSuccess, 
  onUploadError 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        setSelectedFile(null);
        setPreview(null);
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        setSelectedFile(null);
        setPreview(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const result = await uploadImage(selectedFile, courseId);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call the success callback with the image URL
      onUploadSuccess(result);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      
      // More detailed error message based on the error
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = 'You do not have permission to upload images. Please contact an administrator.';
        } else if (err.response.status === 401) {
          errorMessage = 'You are not authenticated. Please log in again.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Upload Image
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          id="image-upload"
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        
        <label htmlFor="image-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<UploadIcon />}
            sx={{ mb: 2 }}
          >
            Select Image
          </Button>
        </label>
        
        {preview && (
          <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} 
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 / 1024 < 0.1 
                ? `${Math.round((selectedFile?.size || 0) / 1024)} KB` 
                : `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`})
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ mt: 2 }}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </Box>
    </Box>
  );
};

export default ImageUpload;
