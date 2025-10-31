import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Block } from '../../../types/blocks';

interface BlockActionsProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isDraggable?: boolean;
  dragHandleProps?: any;
  isPreviewMode?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (blockId: string) => void;
  isGroup?: boolean;
  isGroupLocked?: boolean;
  onToggleGroupLock?: (groupId: string) => void;
  onAddBlockToGroup?: (groupId: string) => void;
}

/**
 * A component that renders the action buttons for a block
 */
export const BlockActions: React.FC<BlockActionsProps> = ({
  block,
  onEdit,
  onDelete,
  isDraggable = false,
  dragHandleProps = null,
  isPreviewMode = false,
  isCollapsed = false,
  onToggleCollapse = () => {},
  isGroup = false,
  isGroupLocked = true,
  onToggleGroupLock = () => {},
  onAddBlockToGroup = () => {}
}) => {
  // Handle collapse toggle
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(block.id);
  };

  // Handle group lock toggle
  const handleToggleGroupLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGroupLock(block.id);
  };

  // Handle add block to group
  const handleAddBlockToGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddBlockToGroup(block.id);
  };

  return (
    <>
      {/* Main action buttons (visible when not in preview mode) */}
      {!isPreviewMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            p: 1,
            gap: 0.5,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderBottomLeftRadius: '4px',
            zIndex: 10
          }}
        >
          {/* Drag handle (only visible when isDraggable is true) */}
          {isDraggable && dragHandleProps && (
            <div
              {...dragHandleProps}
              style={{
                cursor: isDraggable ? 'grab' : 'default',
                display: 'flex',
                alignItems: 'center',
                visibility: isDraggable ? 'visible' : 'hidden'
              }}
              data-drag-handle="true"
              data-block-id={block.id}
            >
              <DragIcon fontSize="small" color="action" />
            </div>
          )}

          {/* Collapse toggle */}
          <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              size="small"
              onClick={handleToggleCollapse}
              color="default"
            >
              {isCollapsed ? (
                <ExpandMoreIcon fontSize="small" />
              ) : (
                <ExpandLessIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Edit button */}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit(block)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Delete button */}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(block.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Group-specific actions */}
          {isGroup && (
            <>
              {/* Toggle group lock */}
              <Tooltip title={isGroupLocked ? 'Unlock Group' : 'Lock Group'}>
                <IconButton
                  size="small"
                  onClick={handleToggleGroupLock}
                  color={isGroupLocked ? 'default' : 'success'}
                >
                  {isGroupLocked ? (
                    <LockIcon fontSize="small" />
                  ) : (
                    <LockOpenIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              {/* Add block to group (only visible when group is unlocked) */}
              {!isGroupLocked && (
                <Tooltip title="Add Block to Group">
                  <IconButton
                    size="small"
                    onClick={handleAddBlockToGroup}
                    color="primary"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      )}

      {/* Alternative drag handle for drag and drop (positioned on the left side) */}
      {isDraggable && dragHandleProps && (
        <Box
          {...dragHandleProps}
          sx={{
            position: 'absolute',
            top: '10px',
            left: '-18px',
            color: 'text.secondary',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'all 0.15s ease',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'white',
              boxShadow: '0 1px 5px rgba(0,0,0,0.3)'
            },
            '&:active': {
              cursor: 'grabbing'
            }
          }}
          data-drag-handle="true"
          data-block-id={block.id}
        >
          <DragIcon fontSize="small" />
        </Box>
      )}
    </>
  );
}; 