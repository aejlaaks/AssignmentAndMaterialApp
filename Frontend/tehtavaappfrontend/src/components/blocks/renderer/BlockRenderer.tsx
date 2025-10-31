import React, { useState } from 'react';
import { Block, BlockGroup } from '../../../types/blocks';
import { BlockContainer } from './BlockContainer';
import { BlockActions } from './BlockActions';
import { BlockContentRenderer } from './BlockContentRenderer';

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
}

/**
 * Unified block renderer that composes smaller components
 */
export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  onEdit,
  onDelete,
  onAddBlock,
  isPreviewMode = false,
  isDraggable = false,
  dragHandleProps = null,
  unlockedGroups = new Set<string>(),
  onToggleGroupLock = () => {},
}) => {
  // State for collapse status
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Handle collapse toggle
  const handleToggleCollapse = (blockId: string) => {
    setIsCollapsed(prev => !prev);
  };

  // Determine if block is a group
  const isGroup = block.type === 'group';
  
  // Determine if group is locked (if applicable)
  const isGroupLocked = isGroup ? !unlockedGroups.has(block.id) : true;
  
  // Determine if block should be hidden in preview mode
  const isHidden = isPreviewMode && block.isVisible === false;
  
  return (
    <BlockContainer
      block={block}
      isPreviewMode={isPreviewMode}
      isDraggable={isDraggable}
      isCollapsed={isCollapsed}
      isHidden={isHidden}
    >
      {/* Render action buttons */}
      <BlockActions
        block={block}
        onEdit={onEdit}
        onDelete={onDelete}
        isDraggable={isDraggable}
        dragHandleProps={dragHandleProps}
        isPreviewMode={isPreviewMode}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isGroup={isGroup}
        isGroupLocked={isGroupLocked}
        onToggleGroupLock={onToggleGroupLock}
        onAddBlockToGroup={onAddBlock || (() => {})}
      />
      
      {/* Render block content */}
      <BlockContentRenderer
        block={block}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddBlock={onAddBlock}
        isPreviewMode={isPreviewMode}
        unlockedGroups={unlockedGroups}
        onToggleGroupLock={onToggleGroupLock}
      />
    </BlockContainer>
  );
}; 