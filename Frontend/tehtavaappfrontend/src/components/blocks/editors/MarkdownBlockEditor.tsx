import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { MarkdownBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import MarkdownEditor from '../../common/MarkdownEditor';
import { isBlockOfType } from '../common/BlockUtils';

/**
 * Editor component for markdown blocks
 */
export const MarkdownBlockEditor: React.FC<BlockEditorProps<MarkdownBlock>> = ({
  block,
  onChange,
  onValidityChange
}) => {
  // Initialize content from block or empty string
  const [content, setContent] = useState<string>(
    (block && isBlockOfType(block, 'markdown') ? block.content : '') || ''
  );

  // Update validity when content changes
  useEffect(() => {
    if (onValidityChange) {
      // Markdown blocks are valid as long as they have some content
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
      <MarkdownEditor
        value={content}
        onChange={setContent}
        minRows={10}
      />
    </Box>
  );
}; 