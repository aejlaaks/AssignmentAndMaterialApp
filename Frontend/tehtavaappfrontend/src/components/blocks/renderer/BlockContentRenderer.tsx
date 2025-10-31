import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Block, BlockGroup } from '../../../types/blocks';
import { TextBlockContent } from '../content/TextBlockContent';
import { MarkdownBlockContent } from '../content/MarkdownBlockContent';
import { ImageBlockContent } from '../content/ImageBlockContent';
import { MaterialBlockContent } from '../content/MaterialBlockContent';
import { AssignmentBlockContent } from '../content/AssignmentBlockContent';
import { HtmlBlockContent } from '../content/HtmlBlockContent';
import { BlockGroupContentNew } from '../content/BlockGroupContentNew';
import { TestBlockContent } from '../content/TestBlockContent';

interface BlockContentRendererProps {
  block: Block;
  onEdit?: (block: Block) => void;
  onDelete?: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isPreviewMode?: boolean;
  unlockedGroups?: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
}

/**
 * Component to render the appropriate content based on block type
 */
export const BlockContentRenderer: React.FC<BlockContentRendererProps> = ({
  block,
  onEdit = () => {},
  onDelete = () => {},
  onAddBlock = () => {},
  isPreviewMode = false,
  unlockedGroups = new Set<string>(),
  onToggleGroupLock = () => {}
}) => {
  // Helper function to check if block should be hidden in preview mode
  const isTempHidden = (blockId: string) => {
    return isPreviewMode && block.isVisible === false;
  };

  // If in preview mode and temporarily hidden, show a placeholder
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

  // Render content based on block type
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
      return (
        <BlockGroupContentNew
          block={block as BlockGroup}
          isUnlocked={unlockedGroups.has(block.id)}
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