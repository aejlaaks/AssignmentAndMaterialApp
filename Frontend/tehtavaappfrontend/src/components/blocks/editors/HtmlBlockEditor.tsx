import React, { useState, useEffect } from 'react';
import { Box, TextField, Paper } from '@mui/material';
import { HtmlBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';

/**
 * Editor component for HTML blocks
 */
export const HtmlBlockEditor: React.FC<BlockEditorProps<HtmlBlock>> = ({
  block,
  onChange,
  onValidityChange
}) => {
  const [content, setContent] = useState<string>(block?.content || '');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  
  // Update validity when content changes
  useEffect(() => {
    if (onValidityChange) {
      // HTML blocks are valid as long as they have some content
      const isValid = content.trim().length > 0;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ content });
    }
    
    // Update preview HTML after debounce
    const timer = setTimeout(() => {
      setPreviewHtml(content);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [content, onChange, onValidityChange]);

  return (
    <Box>
      <TextField
        label="HTML Content"
        multiline
        rows={10}
        fullWidth
        value={content}
        onChange={(e) => setContent(e.target.value)}
        margin="normal"
        placeholder="<div>Enter your HTML content here...</div>"
        required
      />
      
      {content && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ mb: 1, fontWeight: 'bold' }}>Preview:</Box>
          <Paper sx={{ p: 2, overflow: 'auto', maxHeight: '300px' }}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </Paper>
        </Box>
      )}
    </Box>
  );
}; 