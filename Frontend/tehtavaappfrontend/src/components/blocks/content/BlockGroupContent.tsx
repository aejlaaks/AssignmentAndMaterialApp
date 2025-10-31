import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Block, BlockGroup } from '../../../types/blocks';
import { BlockList } from '../BlockList';

export interface BlockGroupContentProps {
  block: BlockGroup;
  isVisible: boolean;
  onToggleVisibility: (groupId: string) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
}

export const BlockGroupContent: React.FC<BlockGroupContentProps> = ({
  block,
  isVisible,
  onToggleVisibility,
  onEdit,
  onDelete,
  isPreviewMode = false,
}) => {
  const handleReorderBlocks = (reorderedBlocks: Block[]) => {
    // Create a new group with updated blocks
    console.log(`Reordering blocks within group ${block.id}, blocks count: ${reorderedBlocks.length}`);
    
    const updatedGroup: BlockGroup = {
      ...block,
      blocks: reorderedBlocks,
    };
    
    console.log('Updated group:', updatedGroup);
    onEdit(updatedGroup);
  };

  console.log('Rendering BlockGroupContent for group:', block.id, 'with blocks:', block.blocks?.length || 0);

  return (
    <Paper
      elevation={2}
      sx={{
        overflow: 'hidden',
        mb: 2,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: !isPreviewMode ? 3 : 2,
        },
      }}
      data-block-group-id={block.id}
    >
      {/* Group Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: isVisible ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h3">
            {block.title}
          </Typography>
          {block.description && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {block.description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isPreviewMode && (
            <>
              <IconButton
                size="small"
                onClick={() => onEdit(block)}
                sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(block.id)}
                sx={{ color: 'inherit', opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton
            size="small"
            onClick={() => onToggleVisibility(block.id)}
            sx={{ color: 'inherit', ml: 1 }}
          >
            {isVisible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isVisible}>
        <Box sx={{ p: 2 }}>
          <BlockList
            blocks={block.blocks || []}
            onReorder={handleReorderBlocks}
            onEdit={onEdit}
            onDelete={onDelete}
            isPreviewMode={isPreviewMode}
            isNested={true}
            groupId={block.id}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}; 