import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { TextBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import { TextArea } from '../common/FormFields';
import { isBlockOfType } from '../common/BlockUtils';

/**
 * Editor component for text blocks
 */
export const TextBlockEditor: React.FC<BlockEditorProps<TextBlock>> = ({
  block,
  onChange,
  onValidityChange
}) => {
  // Initialize content from block or empty string
  const [content, setContent] = useState<string>(
    (block && isBlockOfType(block, 'text') ? block.content : '') || ''
  );

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  // Update validity and notify parent when content changes
  useEffect(() => {
    if (onValidityChange) {
      // Text blocks are valid as long as they have some content
      const isValid = content.trim().length > 0;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ content });
    }
  }, [content, onChange, onValidityChange]);

  return (
    <Box>
      <TextArea
        label="Content"
        value={content}
        onChange={handleContentChange}
        rows={6}
        placeholder="Enter the text content here..."
        required
        error={content.trim().length === 0}
        helperText={content.trim().length === 0 ? "Content is required" : ""}
      />
    </Box>
  );
}; 