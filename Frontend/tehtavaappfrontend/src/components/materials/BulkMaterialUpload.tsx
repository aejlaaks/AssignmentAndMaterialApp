import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  HourglassEmpty,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { materialService } from '../../services/materials/materialService';
import { IMaterialCreateRequest } from '../../services/materials/materialTypes';
import { fileUploadService } from '../../services/fileUploadService';

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to determine material type from MIME type
const getFileType = (mimeType: string): string => {
  if (!mimeType) return 'Document';
  
  if (mimeType.startsWith('image/')) {
    return 'Image';
  } else if (mimeType.includes('pdf')) {
    return 'PDF';
  } else if (mimeType.includes('audio/')) {
    return 'Audio';
  } else if (mimeType.includes('video/')) {
    return 'Video';
  } else if (mimeType.includes('text/')) {
    return 'Text';
  }
  
  return 'Document';
};

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'warning' | 'error';
  message: string;
}

interface BulkMaterialUploadProps {
  courseId: string | number;
  onComplete?: () => void; // Callback to refresh materials list after upload completes
}

const BulkMaterialUpload: React.FC<BulkMaterialUploadProps> = ({ courseId, onComplete }) => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files).map(file => ({
        file,
        status: 'pending' as const,
        message: ''
      }));
      setFiles(selectedFiles);
      setError('');
      setStatusMessage('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files to upload.");
      return;
    }

    // Initialize upload states
    setUploadProgress(0);
    setError("");
    setIsUploading(true);
    setStatusMessage('');

    let successCount = 0;
    let allFilesProcessed = 0;
    const totalFiles = files.length;
    const updatedFiles = [...files];

    // Format courseId as a string to ensure consistency
    const courseIdString = courseId ? String(courseId) : "";
    console.log(`Starting bulk upload with courseId: ${courseIdString} (type: ${typeof courseIdString})`);

    // Create an array to store the uploaded material IDs
    const uploadedMaterialIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      // Update status of current file
      updatedFiles[i] = { ...updatedFiles[i], status: 'uploading', message: 'Creating material record...' };
      setFiles([...updatedFiles]);

      try {
        // Create material data for upload
        const materialData: IMaterialCreateRequest = {
          title: fileData.file.name,
          description: `Uploaded on ${new Date().toLocaleString()}`,
          type: "file",
          courseId: courseIdString
        };

        console.log(`Creating material with courseId: ${materialData.courseId}`);
        
        // Create FormData for the file upload
        const formData = new FormData();
        formData.append('title', materialData.title);
        formData.append('description', materialData.description);
        formData.append('file', fileData.file);
        if (materialData.courseId) {
          formData.append('courseId', materialData.courseId);
        }
        if (materialData.type) {
          formData.append('type', materialData.type);
        }
        
        // Step 1: Upload material with file in one step using createMaterialWithFormData
        const materialResponse = await materialService.createMaterialWithFormData(formData);
        
        if (materialResponse && materialResponse.id) {
          // Update status to success since file was uploaded with material in one step
          updatedFiles[i] = { ...updatedFiles[i], status: 'success', message: 'Upload complete' };
          successCount++;
          console.log(`Successfully uploaded material ${materialResponse.id} with file information`);
          
          // Store the uploaded material ID
          uploadedMaterialIds.push(materialResponse.id);
        } else {
          // Handle material creation failure
          console.error('Material upload failed without error');
          updatedFiles[i] = { ...updatedFiles[i], status: 'error', message: 'Failed to upload material' };
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        updatedFiles[i] = { 
          ...updatedFiles[i], 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
      }

      // Update progress and file list
      allFilesProcessed++;
      const progress = Math.round((allFilesProcessed / totalFiles) * 100);
      setUploadProgress(progress);
      setFiles([...updatedFiles]);
    }

    // Force refresh materials for this course in the cache
    if (successCount > 0 && courseIdString) {
      try {
        console.log(`Refreshing materials for course ${courseIdString} after bulk upload`);
        await materialService.getMaterials(courseIdString, true); // true = force refresh
        
        // Also refresh all materials cache
        await materialService.getAllMaterials(true);
        
        console.log('Material caches refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing materials cache:', refreshError);
      }
    }

    setIsUploading(false);
    
    if (successCount === totalFiles) {
      setStatusMessage(`All ${totalFiles} files uploaded successfully.`);
      // Call the onComplete callback if provided to refresh the materials list
      if (onComplete) {
        console.log('Calling onComplete callback to refresh materials list');
        onComplete();
      }
    } else if (successCount > 0) {
      setStatusMessage(`${successCount} files uploaded successfully, ${totalFiles - successCount} failed.`);
      // Call the onComplete callback even with partial success
      if (onComplete) {
        console.log('Calling onComplete callback to refresh materials list (partial success)');
        onComplete();
      }
    } else {
      setStatusMessage(`All uploads failed. Please check your connection and try again.`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'uploading': return <HourglassEmpty color="info" />;
      default: return <HourglassEmpty color="disabled" />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Bulk Upload Materials
      </Typography>
      
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="*/*"
      />
      
      <Button 
        variant="contained" 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        sx={{ mb: 2, mr: 2 }}
      >
        Select Files
      </Button>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleUpload} 
        disabled={isUploading || files.length === 0}
        sx={{ mb: 2 }}
      >
        Upload Files
      </Button>
      
      {files.length > 0 && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {files.length} file(s) selected
        </Typography>
      )}
      
      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      
      {statusMessage && (
        <Typography sx={{ mb: 1 }}>
          {statusMessage}
        </Typography>
      )}
      
      {isUploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {uploadProgress}% Complete
          </Typography>
        </Box>
      )}
      
      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {getStatusIcon(file.status)}
              </ListItemIcon>
              <ListItemText 
                primary={file.file.name} 
                secondary={file.message || file.status} 
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default BulkMaterialUpload; 