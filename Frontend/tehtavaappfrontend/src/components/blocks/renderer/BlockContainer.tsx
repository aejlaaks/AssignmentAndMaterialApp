import React, { ReactNode } from 'react';
import { Paper, PaperProps, Box } from '@mui/material';
import { Block, BlockType } from '../../../types/blocks';

interface BlockContainerProps {
  block: Block;
  children: ReactNode;
  isPreviewMode?: boolean;
  isDraggable?: boolean;
  isCollapsed?: boolean;
  isHidden?: boolean;
  paperProps?: PaperProps;
}

/**
 * A container component for block content with consistent styling
 */
export const BlockContainer: React.FC<BlockContainerProps> = ({
  block,
  children,
  isPreviewMode = false,
  isDraggable = false,
  isCollapsed = false,
  isHidden = false,
  paperProps = {}
}) => {
  // Get the border color based on block type
  const getBlockBorderColor = (blockType: BlockType) => {
    switch (blockType) {
      case 'text':
        return '#2196f3'; // Blue
      case 'markdown':
        return '#ff9800'; // Orange
      case 'image':
        return '#4caf50'; // Green
      case 'material':
        return '#9c27b0'; // Purple
      case 'assignment':
        return '#f44336'; // Red
      case 'html':
        return '#607d8b'; // Blue Grey
      case 'group':
        return '#ff9800'; // Orange
      case 'test':
        return '#9c27b0'; // Purple
      default:
        return '#e0e0e0'; // Grey
    }
  };

  return (
    <Paper
      elevation={2}
      {...paperProps}
      sx={{
        p: 2,
        mb: 2,
        position: 'relative',
        borderLeft: `4px solid ${getBlockBorderColor(block.type)}`,
        // Apply opacity for hidden blocks
        opacity: isHidden ? 0.7 : 1,
        // Collapsed state
        maxHeight: isCollapsed ? '60px' : 'auto',
        overflow: isCollapsed ? 'hidden' : 'visible',
        transition: 'all 0.2s ease',
        // Hover effects for draggable items
        ...(isDraggable ? {
          '&:hover': {
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.3)',
          },
          '&:active': {
            cursor: 'grabbing',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            transform: 'scale(1.01)',
          },
        } : {}),
        // Merge with any additional Paper props
        ...paperProps.sx
      }}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {children}
    </Paper>
  );
}; 