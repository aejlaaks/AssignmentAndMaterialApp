import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  TextField
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { 
  Block, 
  BlockType, 
  BlockDialogProps, 
  TextBlock,
  MarkdownBlock,
  ImageBlock,
  MaterialBlock,
  AssignmentBlock,
  HtmlBlock,
  BlockGroup,
  TestBlock
} from '../../types/blocks';

import { BlockEditor } from './editors/BlockEditor';

// Define an extended interface that includes all possible block properties
interface ExtendedBlockData extends Partial<Block> {
  // Text/Markdown/HTML block specific properties
  content?: string;
  
  // Image block specific properties
  url?: string;
  materialId?: string;
  
  // Assignment block specific properties
  assignmentId?: string;
  assignmentName?: string;
  assignmentDescription?: string;
  dueDate?: string;
  
  // Group block specific properties
  description?: string;
  blocks?: Block[];
  
  // Test block specific properties
  testId?: string;
  proctored?: boolean;
  showResults?: 'immediately' | 'after_due_date' | 'manual';
  timeLimit?: number;
  passingScore?: number;
  attempts?: number;
  allowedResources?: string[];
}

/**
 * An improved block dialog component using the new unified block editor
 */
export const BlockDialogNew: React.FC<BlockDialogProps> = ({
  open,
  onClose,
  onSave,
  editingBlock,
  courseId,
}) => {
  // Block type state
  const [blockType, setBlockType] = useState<BlockType>('text');
  
  // Block data state - all modifications to the block will be stored here
  const [blockData, setBlockData] = useState<ExtendedBlockData>({
    title: '',
    isVisible: true
  });

  // Form validity state
  const [isFormValid, setIsFormValid] = useState(false);

  // Reset and initialize when dialog opens or editingBlock changes
  useEffect(() => {
    if (open) {
      if (editingBlock) {
        // Editing an existing block
        setBlockType(editingBlock.type);
        setBlockData(editingBlock);
      } else {
        // Creating a new block
        setBlockType('text');
        setBlockData({
          title: '',
          isVisible: true
        });
      }
    }
  }, [open, editingBlock]);

  // Handle block type change
  const handleBlockTypeChange = (newType: BlockType) => {
    setBlockType(newType);
    
    // Preserve title and visibility when changing type
    setBlockData(prev => ({
      title: prev.title || '',
      isVisible: prev.isVisible !== false
    }));
  };

  // Handle form validity change
  const handleValidityChange = (isValid: boolean) => {
    setIsFormValid(isValid && !!blockData.title?.trim());
  };

  // Handle title change
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setBlockData(prev => ({
      ...prev,
      title: newTitle
    }));
    
    // Update validity
    setIsFormValid(!!newTitle.trim() && isFormValid);
  };

  // Handle visibility change
  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVisibility = event.target.checked;
    setBlockData(prev => ({
      ...prev,
      isVisible: newVisibility
    }));
  };

  // Handle block data changes from editor
  const handleBlockDataChange = (data: Partial<Block>) => {
    setBlockData(prev => ({
      ...prev,
      ...data
    }));
  };

  // Handle save
  const handleSave = () => {
    // Common block properties
    const commonProps: Block = {
      id: editingBlock?.id || uuidv4(),
      type: blockType,
      title: blockData.title || 'Unnamed Block',
      order: editingBlock?.order || 0,
      isVisible: blockData.isVisible,
      groupId: editingBlock?.groupId
    };

    // Create the final block object based on type
    let newBlock: Block;

    switch (blockType) {
      case 'text':
        newBlock = {
          ...commonProps,
          type: 'text',
          content: blockData.content || '',
        } as TextBlock;
        break;
      case 'markdown':
        newBlock = {
          ...commonProps,
          type: 'markdown',
          content: blockData.content || '',
        } as MarkdownBlock;
        break;
      case 'image':
        newBlock = {
          ...commonProps,
          type: 'image',
          url: blockData.url || '',
          materialId: blockData.materialId,
        } as ImageBlock;
        break;
      case 'material':
        newBlock = {
          ...commonProps,
          type: 'material',
          materialId: blockData.materialId || '',
        } as MaterialBlock;
        break;
      case 'assignment':
        newBlock = {
          ...commonProps,
          type: 'assignment',
          assignmentId: blockData.assignmentId || '',
          assignmentName: blockData.assignmentName,
          assignmentDescription: blockData.assignmentDescription,
          dueDate: blockData.dueDate
        } as AssignmentBlock;
        break;
      case 'html':
        newBlock = {
          ...commonProps,
          type: 'html',
          content: blockData.content || '',
        } as HtmlBlock;
        break;
      case 'group':
        // Preserve existing blocks when editing
        const existingBlocks = editingBlock?.type === 'group' 
          ? (editingBlock as BlockGroup).blocks || [] 
          : [];
          
        newBlock = {
          ...commonProps,
          type: 'group',
          description: blockData.description || '',
          blocks: existingBlocks,
        } as BlockGroup;
        break;
      case 'test':
        newBlock = {
          ...commonProps,
          type: 'test',
          testId: blockData.testId || '',
          proctored: blockData.proctored || false,
          showResults: blockData.showResults as 'immediately' | 'after_due_date' | 'manual' || 'immediately',
          timeLimit: blockData.timeLimit || 60,
          passingScore: blockData.passingScore || 60,
          attempts: blockData.attempts || 1,
          dueDate: blockData.dueDate,
          allowedResources: blockData.allowedResources || []
        } as TestBlock;
        break;
      default:
        console.error(`Unsupported block type: ${blockType}`);
        return;
    }
    
    // Call onSave with the final block
    onSave(newBlock);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {editingBlock ? 'Edit Block' : 'Create New Block'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Block Type Selection */}
          <FormControl fullWidth>
            <InputLabel id="block-type-label">Block Type</InputLabel>
            <Select
              labelId="block-type-label"
              id="block-type"
              value={blockType}
              label="Block Type"
              onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
              disabled={!!editingBlock?.id}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="image">Image</MenuItem>
              <MenuItem value="material">Material</MenuItem>
              <MenuItem value="assignment">Assignment</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="group">Block Group</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </Select>
          </FormControl>
          
          {/* Common fields */}
          <Box sx={{ mb: 2 }}>
            {/* Title field */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                fullWidth
                id="block-title"
                label="Title"
                value={blockData.title || ''}
                onChange={handleTitleChange}
                margin="normal"
                variant="outlined"
                required
                error={!blockData.title?.trim()}
                helperText={!blockData.title?.trim() ? "Title is required" : ""}
              />
            </FormControl>
            
            {/* Visibility toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={blockData.isVisible !== false}
                  onChange={handleVisibilityChange}
                  color="primary"
                />
              }
              label="Visible to students"
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Dynamic block content editor */}
          <Typography variant="subtitle1" gutterBottom>
            Block Content
          </Typography>
          
          <BlockEditor
            blockType={blockType}
            block={editingBlock as any}
            courseId={courseId}
            onValidityChange={handleValidityChange}
            onChange={handleBlockDataChange}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!isFormValid || !blockData.title}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 