import React from 'react';
import { Box, Paper, Typography, Tooltip, IconButton, Collapse } from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIndicatorIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Block, BlockGroup } from '../../types/blocks';
import { TextBlockContent } from './content/TextBlockContent';
import { MarkdownBlockContent } from './content/MarkdownBlockContent';
import { ImageBlockContent } from './content/ImageBlockContent';
import { MaterialBlockContent } from './content/MaterialBlockContent';
import { AssignmentBlockContent } from './content/AssignmentBlockContent';
import { HtmlBlockContent } from './content/HtmlBlockContent';
import { BlockGroupContentNew } from './content/BlockGroupContentNew';
import { TestBlockContent } from './content/TestBlockContent';

export interface BlockRendererProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isPreviewMode?: boolean;
  isDraggable?: boolean;
  dragHandleProps?: any;
  unlockedGroups?: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (blockId: string) => void;
}

export const BlockRendererNew: React.FC<BlockRendererProps> = ({
  block,
  onEdit,
  onDelete,
  onAddBlock,
  isPreviewMode = false,
  isDraggable = false,
  dragHandleProps = null,
  unlockedGroups = new Set<string>(),
  onToggleGroupLock = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {}
}) => {
  // Get the border color based on block type
  const getBlockBorderColor = () => {
    switch (block.type) {
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
        const isUnlocked = unlockedGroups.has(block.id);
        return isUnlocked ? '#4caf50' : '#ff9800'; // Green if unlocked, Orange if locked
      case 'test':
        return '#9c27b0'; // Purple
      default:
        return '#e0e0e0'; // Grey
    }
  };
  
  // Handle collapse toggle
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(block.id);
  };
  
  // Check if the block is temporarily hidden in preview mode
  const isTempHidden = (blockId: string) => {
    return isPreviewMode && block.isVisible === false;
  };
  
  // Render the content based on block type
  const renderContent = () => {
    // If in preview mode and temporarily hidden, show a note
    if (isTempHidden(block.id)) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <VisibilityOffIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            This content is hidden in preview mode. 
            {isPreviewMode ? ' It will be visible to admins and teachers.' : ' Edit it to change visibility.'}
          </Typography>
        </Box>
      );
    }
    
    // Otherwise render the appropriate content component
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
      case 'group':
        const groupBlock = block as BlockGroup;
        return (
          <BlockGroupContentNew
            block={groupBlock}
            isUnlocked={unlockedGroups.has(groupBlock.id)}
            onToggleLock={onToggleGroupLock}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddBlock={onAddBlock}
            isPreviewMode={isPreviewMode}
          />
        );
      case 'test':
        return <TestBlockContent block={block as any} showTitle={false} />;
      default:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="error">
              Unknown block type: {block.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        position: 'relative',
        borderLeft: `4px solid ${getBlockBorderColor()}`,
        // Only apply opacity for temporarily hidden blocks
        opacity: isTempHidden(block.id) ? 0.7 : 1,
        transition: 'all 0.2s ease',
        // Make the drag preview more visible
        ...(isDraggable ? {
          '&:hover': {
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.3)',
          },
          // Add better drag visual cues
          '&:active': {
            cursor: 'grabbing',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            transform: 'scale(1.01)',
          },
        } : {})
      }}
      data-block-id={block.id}
    >
      {/* Show drag handle if draggable */}
      {isDraggable && dragHandleProps && (
        <Box 
          className="drag-handle"
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
              boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
            },
            '&:active': {
              cursor: 'grabbing',
            }
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
      )}
      
      {/* Block title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
          {block.title || 'Unnamed Block'}
          
          {/* Show locked/unlocked icon for group blocks */}
          {block.type === 'group' && (
            <Tooltip title={unlockedGroups.has(block.id) ? "Ryhmä on avattu" : "Ryhmä on lukittu"}>
              <Box component="span" sx={{ ml: 1, verticalAlign: 'middle', color: unlockedGroups.has(block.id) ? 'success.main' : 'warning.main' }}>
                {unlockedGroups.has(block.id) ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
              </Box>
            </Tooltip>
          )}
          
          {/* Show visibility indicator if needed */}
          {block.isVisible === false && (
            <Tooltip title="Piilotettu opiskelijoilta">
              <VisibilityOffIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary', verticalAlign: 'middle' }} />
            </Tooltip>
          )}
        </Typography>
        
        {/* Action buttons */}
        <Box>
          {/* Collapse/Expand button */}
          <Tooltip title={isCollapsed ? "Laajenna lohko" : "Pienennä lohko"}>
            <IconButton
              onClick={handleToggleCollapse}
              size="small"
              sx={{ mr: 1 }}
            >
              {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {/* Add Block button for group blocks */}
          {block.type === 'group' && onAddBlock && (
            <Tooltip title="Lisää lohko tähän ryhmään">
              <IconButton 
                onClick={() => onAddBlock(block.id)} 
                size="small" 
                color="primary"
                sx={{ mr: 1 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Edit button */}
          {!isPreviewMode && (
            <>
              <Tooltip title="Muokkaa lohkoa">
                <IconButton 
                  onClick={() => onEdit(block)} 
                  size="small" 
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {/* Delete button */}
              <Tooltip title="Poista lohko">
                <IconButton 
                  onClick={() => onDelete(block.id)} 
                  size="small" 
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
      
      {/* Block content with collapse functionality */}
      <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
        {renderContent()}
      </Collapse>
      
      {/* Show a hint when block is collapsed */}
      {isCollapsed && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            textAlign: 'center', 
            p: 1, 
            cursor: 'pointer',
            fontSize: '0.8rem',
            '&:hover': { textDecoration: 'underline' } 
          }}
          onClick={handleToggleCollapse}
        >
          Click to expand content
        </Typography>
      )}
    </Paper>
  );
}; 