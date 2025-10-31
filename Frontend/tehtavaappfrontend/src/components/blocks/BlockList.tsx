import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { BlockRenderer } from './BlockRenderer';
import { Block } from '../../types/blocks';

// Force-disable defaultProps to avoid warnings
(Droppable as any).defaultProps = undefined;
(Draggable as any).defaultProps = undefined;

// Global registry of draggable elements to ensure they're never lost
const DRAGGABLE_REGISTRY = new Map<string, HTMLElement>();

export interface BlockListProps {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
  isNested?: boolean;
  groupId?: string;
}

// Create a stable droppable ID
function getDroppableId(groupId?: string): string {
  return groupId ? `group-${groupId}` : 'main-blocks';
}

// Export for testing
export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  onReorder,
  onEdit,
  onDelete,
  isPreviewMode = false,
  isNested = false,
  groupId,
}) => {
  // If no blocks, show empty state
  if (!blocks || blocks.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
        {isNested 
          ? 'No blocks in this group' 
          : 'No content yet. Add a block to get started.'}
      </div>
    );
  }

  const droppableId = getDroppableId(groupId);
  
  // Log block IDs for debugging
  console.log(`Rendering BlockList with ID ${droppableId}, blocks:`, blocks.map(b => b.id).join(', '));
  
  return (
    <div className="block-list-container" data-droppable-container={droppableId}>
      <Droppable 
        droppableId={droppableId} 
        isDropDisabled={Boolean(isPreviewMode)}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="block-list"
            data-droppable-id={droppableId}
            style={{
              padding: isNested ? 0 : '8px',
              backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 120, 215, 0.1)' : 'transparent',
              minHeight: '50px',
              position: 'relative',
            }}
          >
            {blocks.map((block, index) => {
              if (!block.id) {
                console.error('Block missing ID:', block);
                return null;
              }
              
              return (
                <StableDraggable
                  key={block.id}
                  blockId={block.id}
                  block={block}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isPreviewMode={isPreviewMode}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Stabilized draggable component that ensures DOM elements persist
const StableDraggable = ({
  blockId,
  block,
  index,
  onEdit,
  onDelete,
  isPreviewMode,
}: {
  blockId: string;
  block: Block;
  index: number;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode: boolean;
}) => {
  // Use ref to maintain reference to DOM element
  const elementRef = useRef<HTMLDivElement | null>(null);
  
  // Store block in ref to avoid stale closures
  const blockRef = useRef<Block>(block);
  useEffect(() => {
    blockRef.current = block;
  }, [block]);
  
  // Use layout effect to register element before React finishes
  useLayoutEffect(() => {
    if (elementRef.current) {
      // Register this element in our global registry
      DRAGGABLE_REGISTRY.set(blockId, elementRef.current);
      console.log(`Registered draggable ${blockId} in DOM registry`);
    }
    
    return () => {
      // Only unregister if we're sure it won't be dragged again
      setTimeout(() => {
        if (!document.querySelector(`[data-block-id="${blockId}"]`)) {
          DRAGGABLE_REGISTRY.delete(blockId);
          console.log(`Unregistered draggable ${blockId} from DOM registry`);
        }
      }, 50);
    };
  }, [blockId]);
  
  return (
    <Draggable
      draggableId={blockId}
      index={index}
      isDragDisabled={Boolean(isPreviewMode)}
    >
      {(provided, snapshot) => {
        // Get the element from our registry if it exists during a drag
        const element = snapshot.isDragging ? DRAGGABLE_REGISTRY.get(blockId) : null;
        
        // If element exists in registry and is being dragged, use it
        if (element && snapshot.isDragging) {
          console.log(`Using registered element for draggable ${blockId}`);
          // Need to return a React element even when re-using DOM node
          provided.innerRef(element);
          // This is a hack - return a placeholder that won't be used
          return <div style={{ display: 'none' }} />;
        }
        
        return (
          <div
            ref={(node) => {
              // Set both our ref and provided.innerRef
              elementRef.current = node;
              provided.innerRef(node);
            }}
            {...provided.draggableProps}
            data-block-id={blockId}
            className="block-draggable"
            style={{
              ...provided.draggableProps.style,
              marginBottom: '16px',
              userSelect: 'none',
            }}
          >
            <BlockRenderer
              block={block}
              onEdit={onEdit}
              onDelete={onDelete}
              isPreviewMode={isPreviewMode}
              isDraggable={!isPreviewMode}
              dragHandleProps={provided.dragHandleProps}
            />
          </div>
        );
      }}
    </Draggable>
  );
}; 