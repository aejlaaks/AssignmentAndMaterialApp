import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { Block, BlockGroup } from '../../types/blocks';
import { TextBlockContent } from './content/TextBlockContent';
import { MarkdownBlockContent } from './content/MarkdownBlockContent';
import { ImageBlockContent } from './content/ImageBlockContent';
import { MaterialBlockContent } from './content/MaterialBlockContent';
import { AssignmentBlockContent } from './content/AssignmentBlockContent';
import { HtmlBlockContent } from './content/HtmlBlockContent';
import { BlockGroupContent } from './content/BlockGroupContent';
import { TestBlockContent } from './content/TestBlockContent';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

export interface BlockRendererProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
  isDraggable?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  onEdit,
  onDelete,
  isPreviewMode = false,
  isDraggable = false,
  dragHandleProps = null,
}) => {
  // Track visibility of groups in local state
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());

  const toggleGroupVisibility = (groupId: string) => {
    const newVisibleGroups = new Set(visibleGroups);
    if (newVisibleGroups.has(groupId)) {
      newVisibleGroups.delete(groupId);
    } else {
      newVisibleGroups.add(groupId);
    }
    setVisibleGroups(newVisibleGroups);
  };

  const renderBlockContent = () => {
    // If it's a group block, use the specialized GroupBlockContent component
    if (block.type === 'group') {
      const groupBlock = block as BlockGroup;
      return (
        <BlockGroupContent
          block={groupBlock}
          isVisible={visibleGroups.has(block.id)}
          onToggleVisibility={toggleGroupVisibility}
          onEdit={onEdit}
          onDelete={onDelete}
          isPreviewMode={isPreviewMode}
        />
      );
    }

    // For other block types, render based on type
    switch (block.type) {
      case 'text':
        return <TextBlockContent block={block as any} showTitle={false} />;
      case 'markdown':
        return <MarkdownBlockContent block={block as any} showTitle={false} />;
      case 'image':
        return <ImageBlockContent block={block as any} showTitle={false} />;
      case 'material':
        return <MaterialBlockContent block={block as any} showTitle={false} />;
      case 'assignment':
        return <AssignmentBlockContent block={block as any} showTitle={false} />;
      case 'html':
        return <HtmlBlockContent block={block as any} showTitle={false} />;
      case 'test':
        return <TestBlockContent block={block as any} showTitle={false} />;
      default:
        return <div>Unknown block type: {block.type}</div>;
    }
  };

  // For group blocks, we need to handle them specially
  if (block.type === 'group') {
    return (
      <div style={{ position: 'relative' }}>
        {/* Create a stable drag handle */}
        <div
          {...dragHandleProps}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30px', 
            height: '30px', 
            cursor: isDraggable ? 'grab' : 'default',
            zIndex: 10,
            // Make it visible but subtle
            opacity: isDraggable ? 0.3 : 0,
            transition: 'opacity 0.2s ease'
          }}
          data-drag-handle="true"
          data-block-id={block.id}
        />
        {renderBlockContent()}
      </div>
    );
  }

  // For all other blocks
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        p: 2,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: !isPreviewMode ? 3 : 2
        }
      }}
    >
      {!isPreviewMode && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          display: 'flex',
          p: 1,
          gap: 0.5,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottomLeftRadius: '4px',
          zIndex: 10
        }}>
          {/* Always render the drag handle for stability */}
          <div 
            {...dragHandleProps}
            style={{ 
              cursor: isDraggable ? 'grab' : 'default',
              display: 'flex',
              alignItems: 'center',
              // Hide if not draggable
              visibility: isDraggable ? 'visible' : 'hidden'
            }}
            data-drag-handle="true"
            data-block-id={block.id}
          >
            <DragIcon fontSize="small" color="action" />
          </div>
          <IconButton
            size="small"
            onClick={() => onEdit(block)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(block.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {renderBlockContent()}
    </Paper>
  );
}; 