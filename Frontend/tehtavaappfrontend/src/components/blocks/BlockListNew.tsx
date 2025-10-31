import React, { useState, useEffect, useContext } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  DragMoveEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockGroup } from '../../types/blocks';
import { BlockRendererNew } from './BlockRendererNew';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DragContext } from './NestedBlockList';

interface BlockListProps {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isPreviewMode?: boolean;
  isNested?: boolean;
  groupId?: string;
  unlockedGroups?: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
  // New props for unified drag system
  containerId?: string;
  useDndContext?: boolean;
  // Props for collapse functionality
  initialCollapsedBlocks?: Set<string>;
  onToggleBlockCollapse?: (blockId: string) => void;
}

interface SortableItemProps {
  id: string;
  blockIndex: number;
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isDraggable: boolean;
  isPreviewMode: boolean;
  unlockedGroups?: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
  isLast?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (blockId: string) => void;
}

// Component for sortable block items
const SortableBlockItem: React.FC<SortableItemProps> = ({
  id,
  blockIndex,
  block,
  onEdit,
  onDelete,
  onAddBlock,
  isDraggable,
  isPreviewMode,
  unlockedGroups,
  onToggleGroupLock,
  isLast,
  isCollapsed,
  onToggleCollapse
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    data: {
      type: 'block',
      block: block,
      index: blockIndex
    },
    disabled: !isDraggable || isPreviewMode
  });

  // When dragging starts, set data attribute on body
  useEffect(() => {
    if (isDragging) {
      document.body.setAttribute('data-dragging-block-id', id);
    }
  }, [isDragging, id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
    marginBottom: '12px',
    cursor: isDraggable && !isPreviewMode ? 'grab' : 'default',
  };

  // Create a class name for the dragged item to help with drag detection
  const className = isDragging ? 'dragging' : '';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={className}
      data-block-id={id}
      data-draggable-block
    >
      <BlockRendererNew
        block={block}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        isDraggable={isDraggable && !isPreviewMode}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddBlock={onAddBlock}
        isPreviewMode={isPreviewMode}
        unlockedGroups={unlockedGroups}
        onToggleGroupLock={onToggleGroupLock}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
};

// For non-sortable, static block items
const BlockItem: React.FC<Omit<SortableItemProps, 'isDraggable'>> = ({
  block,
  onEdit,
  onDelete,
  onAddBlock,
  isPreviewMode,
  unlockedGroups,
  onToggleGroupLock,
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      <BlockRendererNew
        block={block}
        isDraggable={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddBlock={onAddBlock}
        isPreviewMode={isPreviewMode}
        unlockedGroups={unlockedGroups}
        onToggleGroupLock={onToggleGroupLock}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
};

// The main component for the block list with drag and drop reordering
export const BlockListNew: React.FC<BlockListProps> = ({
  blocks,
  onReorder,
  onEdit,
  onDelete,
  onAddBlock,
  isPreviewMode = false,
  isNested = false,
  groupId,
  unlockedGroups = new Set<string>(),
  onToggleGroupLock = () => {},
  containerId,
  useDndContext = true, // By default, create own DndContext
  initialCollapsedBlocks,
  onToggleBlockCollapse
}) => {
  // State for managing the active drag item and the current items list
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [items, setItems] = useState<Block[]>(blocks);
  
  // Track which blocks are collapsed
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(() => {
    // If initialCollapsedBlocks is provided, use it
    if (initialCollapsedBlocks) {
      return new Set(initialCollapsedBlocks);
    }
    // Otherwise, set only the first block to be collapsed by default if we have blocks
    return blocks.length > 0 ? new Set([blocks[0].id]) : new Set<string>();
  });

  // Get drag state from parent context if not creating own DndContext
  const parentDragContext = useContext(DragContext);

  // Update items when blocks change externally
  useEffect(() => {
    setItems(blocks);
    
    if (initialCollapsedBlocks) {
      // If we have initial collapsed blocks, use them
      setCollapsedBlocks(new Set(initialCollapsedBlocks));
    } else {
      // Otherwise, ensure only first block is collapsed
      if (blocks.length > 0) {
        const firstBlockId = blocks[0].id;
        
        // If the first block isn't collapsed or we have other blocks collapsed,
        // reset to only have the first block collapsed
        if (!collapsedBlocks.has(firstBlockId) || collapsedBlocks.size > 1) {
          // Only keep the first block collapsed
          setCollapsedBlocks(new Set([firstBlockId]));
        }
      }
    }
  }, [blocks, initialCollapsedBlocks]);

  // Toggle collapse state for a block
  const handleToggleCollapse = (blockId: string) => {
    if (onToggleBlockCollapse) {
      // If external handler is provided, use it
      onToggleBlockCollapse(blockId);
    } else {
      // Otherwise, manage collapse state internally
      setCollapsedBlocks(prev => {
        const newCollapsed = new Set(prev);
        if (newCollapsed.has(blockId)) {
          newCollapsed.delete(blockId);
        } else {
          newCollapsed.add(blockId);
        }
        return newCollapsed;
      });
    }
  };

  // Whether blocks should be draggable
  const isDraggable = !isPreviewMode;

  // Configure sensors for drag events
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle the start of a drag operation
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  };
  
  // Handle drag move events 
  const handleDragMove = (event: DragMoveEvent) => {
    // Can be used to handle dynamic highlighting or visual feedback
  };

  // Handle the end of a drag operation, rearranging items if needed
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Don't do anything if we're not dropping on anything
    if (!over) {
      setActiveId(null);
      return;
    }
    
    // Don't do anything if we're dropping on the same item
    if (active.id === over.id) {
      setActiveId(null);
      return;
    }
    
    // Find the indices of the dragged item and the drop target
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    
    // If both indices are valid, rearrange the array
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder(newItems);
    }
    
    // Clear the active ID
    setActiveId(null);
  };

  // The sorted sortable items
  const sortableContent = (
    <SortableContext items={items.map(item => item.id)}>
      <Stack spacing={1}>
        {items.map((block, index) => (
          <SortableBlockItem
            key={block.id}
            id={block.id}
            blockIndex={index}
            block={block}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddBlock={onAddBlock}
            isDraggable={isDraggable}
            isPreviewMode={isPreviewMode}
            unlockedGroups={unlockedGroups}
            onToggleGroupLock={onToggleGroupLock}
            isLast={index === items.length - 1}
            isCollapsed={collapsedBlocks.has(block.id)}
            onToggleCollapse={handleToggleCollapse}
          />
        ))}
      </Stack>
    </SortableContext>
  );

  // Empty state content
  const emptyStateContent = (
    items.length === 0 && (
      <Box 
        sx={{ 
          p: 2, 
          textAlign: 'center', 
          border: '1px dashed #ccc', 
          borderRadius: 1,
          bgcolor: '#f9f9f9' 
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {isNested ? 
            'This group is empty. Drag blocks here or add new ones.' : 
            'No blocks yet. Add some content to get started.'
          }
        </Typography>
        
        {!isPreviewMode && onAddBlock && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => onAddBlock(groupId || '')}
            sx={{ mt: 1 }}
          >
            Add Content
          </Button>
        )}
      </Box>
    )
  );

  // Render with or without DndContext based on the prop
  if (useDndContext) {
    // Create own DndContext for standalone use
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        {sortableContent}
        {emptyStateContent}
        
        <DragOverlay>
          {activeId ? (
            <div 
              style={{ 
                opacity: 0.8,
                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                transform: 'rotate(2deg)',
                zIndex: 1200,
              }}
            >
              <BlockRendererNew
                block={items.find(item => item.id === activeId) as Block}
                isDraggable={false}
                onEdit={() => {}}
                onDelete={() => {}}
                isPreviewMode={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  } else {
    // Just render the sortable content, using the parent DndContext
    return (
      <>
        {sortableContent}
        {emptyStateContent}
      </>
    );
  }
}; 