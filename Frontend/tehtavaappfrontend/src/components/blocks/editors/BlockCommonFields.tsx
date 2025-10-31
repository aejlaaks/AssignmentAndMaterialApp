import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box
} from '@mui/material';
import { BlockType } from '../../../types/blocks';

interface BlockCommonFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  blockType: BlockType;
  setBlockType: (blockType: BlockType) => void;
  isEditing: boolean;
}

/**
 * Common fields shared across all block types
 */
export const BlockCommonFields: React.FC<BlockCommonFieldsProps> = ({
  title,
  setTitle,
  isVisible,
  setIsVisible,
  blockType,
  setBlockType,
  isEditing
}) => {
  const handleBlockTypeChange = (newType: BlockType) => {
    console.log('Select onChange triggered for block type:', newType);
    setBlockType(newType);
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth margin="normal">
        <InputLabel id="block-type-label">Block Type</InputLabel>
        <Select
          labelId="block-type-label"
          id="block-type-select"
          value={blockType}
          label="Block Type"
          onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
          disabled={isEditing}
        >
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="markdown">Markdown</MenuItem>
          <MenuItem value="image">Image</MenuItem>
          <MenuItem value="material">Material</MenuItem>
          <MenuItem value="assignment">Assignment</MenuItem>
          <MenuItem value="html">HTML</MenuItem>
          <MenuItem value="group">Group</MenuItem>
          <MenuItem value="test">Test</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Title"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
        required
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
          />
        }
        label="Visible to students"
      />
    </Box>
  );
}; 