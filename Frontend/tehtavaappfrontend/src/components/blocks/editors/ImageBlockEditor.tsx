import React, { useState, useEffect } from 'react';
import { 
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Grid,
  Alert
} from '@mui/material';
import { ImageBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import ImageUpload from '../../common/ImageUpload';

/**
 * Editor component for image blocks
 */
export const ImageBlockEditor: React.FC<BlockEditorProps<ImageBlock>> = ({
  block,
  onChange,
  onValidityChange
}) => {
  const [imageUrl, setImageUrl] = useState<string>(block?.imageUrl || '');
  const [content, setContent] = useState<string>(block?.content || '');
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>(block?.imageUrl ? 'url' : 'upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Update validity when fields change
  useEffect(() => {
    if (onValidityChange) {
      // Image blocks are valid when they have an image URL
      const isValid = !!imageUrl;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ 
        imageUrl, 
        content 
      });
    }
  }, [imageUrl, content, onChange, onValidityChange]);

  // Handle image upload success
  const handleImageUploadSuccess = (response: { id: string; fileUrl: string; title?: string }) => {
    setImageUrl(response.fileUrl);
    setUploadError(null);
  };

  // Handle image upload error
  const handleImageUploadError = (error: any) => {
    console.error('Image upload error:', error);
    setUploadError('Failed to upload image. Please try again.');
  };

  return (
    <Box>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Image Source</FormLabel>
        <RadioGroup 
          row
          value={inputMethod}
          onChange={(e) => setInputMethod(e.target.value as 'url' | 'upload')}
        >
          <FormControlLabel value="url" control={<Radio />} label="URL" />
          <FormControlLabel value="upload" control={<Radio />} label="Upload" />
        </RadioGroup>
      </FormControl>

      {inputMethod === 'url' ? (
        <TextField
          label="Image URL"
          fullWidth
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          margin="normal"
          placeholder="https://example.com/image.jpg"
          required
        />
      ) : (
        <Box sx={{ my: 2 }}>
          <ImageUpload
            onUploadSuccess={handleImageUploadSuccess}
            onUploadError={handleImageUploadError}
          />
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
          {imageUrl && (
            <Box sx={{ mt: 2 }}>
              <img 
                src={imageUrl} 
                alt="Uploaded preview" 
                style={{ maxWidth: '100%', maxHeight: '200px' }} 
              />
            </Box>
          )}
        </Box>
      )}

      <TextField
        label="Image Caption/Description"
        multiline
        rows={3}
        fullWidth
        value={content}
        onChange={(e) => setContent(e.target.value)}
        margin="normal"
        placeholder="Enter a description for the image..."
      />
    </Box>
  );
}; 