import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Block, BlockGroup } from '../../../types/blocks';
import { BlockListNew } from '../BlockListNew';

export interface BlockGroupContentNewProps {
  block: BlockGroup;
  isUnlocked: boolean;  // Renamed from isVisible
  onToggleLock: (groupId: string) => void;  // Renamed from onToggleVisibility
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void; // New prop for adding a block to this group
  isPreviewMode?: boolean;
}

export const BlockGroupContentNew: React.FC<BlockGroupContentNewProps> = ({
  block,
  isUnlocked,  // Renamed from isVisible
  onToggleLock,  // Renamed from onToggleVisibility
  onEdit,
  onDelete,
  onAddBlock,
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

  return (
    <Paper 
      elevation={2}
      sx={{
        border: !isUnlocked ? '2px solid #ffb74d' : 'none',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: !isUnlocked ? '#fff8e1' : '#f5f5f5',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isUnlocked && (
            <LockIcon fontSize="small" color="warning" />
          )}
          <Typography variant="h6" color={!isUnlocked ? 'warning.main' : 'primary'}>
            {block.title}
          </Typography>
        </Box>
        <Box>
          {!isPreviewMode && (
            <>
              {/* Add Block button - only show when unlocked */}
              {isUnlocked && onAddBlock && (
                <Tooltip title="Lisää lohko ryhmään">
                  <IconButton
                    size="small"
                    onClick={() => onAddBlock(block.id)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton
                size="small"
                onClick={() => onEdit(block)}
                title="Muokkaa ryhmää"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(block.id)}
                title="Poista ryhmä"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton
            size="small"
            onClick={() => onToggleLock(block.id)}
            title={isUnlocked ? 'Lock Group for Adding Blocks' : 'Unlock Group'}
            color={!isUnlocked ? 'warning' : 'default'}
          >
            {isUnlocked ? <LockOpenIcon /> : <LockIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Description if available */}
      {block.description && (
        <Box sx={{ px: 2, py: 1, bgcolor: !isUnlocked ? '#fff8e1' : 'transparent' }}>
          <Typography variant="body2" color="text.secondary">
            {block.description}
          </Typography>
        </Box>
      )}
      
      {/* Always show content */}
      <Box sx={{ p: 2 }}>
        <BlockListNew
          blocks={block.blocks || []}
          onReorder={handleReorderBlocks}
          onEdit={onEdit}
          onDelete={onDelete}
          isPreviewMode={isPreviewMode}
          isNested={true}
        />
      </Box>
    </Paper>
  );
}; 