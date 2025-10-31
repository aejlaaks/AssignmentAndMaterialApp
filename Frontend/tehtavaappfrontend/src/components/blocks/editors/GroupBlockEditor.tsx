import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import { BlockGroup } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';

/**
 * Editor component for group blocks
 */
export const GroupBlockEditor: React.FC<BlockEditorProps<BlockGroup>> = ({
  block,
  onChange,
  onValidityChange
}) => {
  const [description, setDescription] = useState<string>(block?.description || '');

  // Update validity when description changes
  useEffect(() => {
    if (onValidityChange) {
      // Group blocks are valid when they have a description
      const isValid = description.trim().length > 0;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ description });
    }
  }, [description, onChange, onValidityChange]);

  return (
    <Box>
      <TextField
        label="Group Description"
        multiline
        rows={4}
        fullWidth
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        margin="normal"
        placeholder="Enter a description for this group of blocks..."
        required
        helperText="This description will help students understand the purpose of this group of content."
      />
    </Box>
  );
}; 