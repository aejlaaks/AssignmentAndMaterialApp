import React, { useState, useCallback, useEffect, useContext } from 'react';
import { 
  DndContext, 
  closestCenter, 
  closestCorners,
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
  UniqueIdentifier,
  useDraggable,
  useDroppable,
  rectIntersection,
  pointerWithin,
  getFirstCollision,
  DndContextProps,
  CollisionDetection,
  MeasuringStrategy
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Paper, Typography, Divider, Alert, Stack, Chip, Button, IconButton } from '@mui/material';
import { Block, BlockGroup } from '../../types/blocks';
import { BlockListNew } from './BlockListNew';
import { BlockRendererNew } from './BlockRendererNew';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import './blocks.css';

interface NestedBlockListProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isPreviewMode?: boolean;
  unlockedGroups?: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
}

// Custom context to pass drag state down to child components
export const DragContext = React.createContext<{
  activeId: UniqueIdentifier | null;
  isDragging: boolean;
}>({
  activeId: null,
  isDragging: false,
});

// Container type identifiers
const TOP_LEVEL_CONTAINER = 'top-level';
const GROUP_CONTAINER_PREFIX = 'group-';

// Group drop zone component
const GroupDropZone = React.memo(({
  group, 
  blocks,
  children, 
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  isPreviewMode,
  onAddBlock,
  isUnlocked
}: {
  group: BlockGroup;
  blocks: Block[];
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode: boolean;
  onAddBlock?: (groupId: string) => void;
  isUnlocked: boolean;
}) => {
  // Set up droppable area with better data
  const { setNodeRef, isOver, active } = useDroppable({
    id: `${GROUP_CONTAINER_PREFIX}${group.id}`,
    data: {
      type: 'group',
      accepts: 'block',
      groupId: group.id,
      isUnlocked,
      title: group.title
    },
    disabled: isUnlocked || isPreviewMode
  });

  // Check if there's an active drag operation anywhere
  const dragContext = useContext(DragContext);
  const isDraggingGlobally = dragContext.isDragging;
  
  // Check if this is a valid drop target
  const draggingBlockId = typeof document !== 'undefined' ? 
    document.body.getAttribute('data-dragging-block-id') : null;
  
  // Visual feedback states
  const canDrop = isOver && active?.data?.current?.type === 'block' && !isUnlocked;
  const shouldHighlight = !isUnlocked && isDraggingGlobally && !isPreviewMode;
  
  // Log when the drop zone is activated
  useEffect(() => {
    if (isOver) {
      console.log(`Group drop zone active: ${group.id} (${group.title})`);
    }
  }, [isOver, group.id, group.title]);
  
  return (
    <Paper 
      ref={setNodeRef}
      elevation={canDrop ? 4 : 2}
      sx={{ 
        p: 2,
        mb: 3,
        position: 'relative',
        border: canDrop ? '3px dashed #2196f3' : 
               shouldHighlight ? '2px dashed #4caf50' : '1px solid #e0e0e0',
        borderLeft: `4px solid ${isUnlocked ? '#4caf50' : '#ff9800'}`,
        backgroundColor: canDrop ? 'rgba(33, 150, 243, 0.08)' : 
                      shouldHighlight ? 'rgba(76, 175, 80, 0.04)' : 'white',
        transition: 'all 0.2s ease',
        minHeight: isCollapsed ? '100px' : '150px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        zIndex: canDrop ? 100 : shouldHighlight ? 10 : 1,
        "&::before": shouldHighlight && !canDrop ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          border: '2px dashed transparent',
          zIndex: 2
        } : {},
        '&[data-valid-drop-target="true"]': {
          boxShadow: '0 0 0 4px rgba(33, 150, 243, 0.4)',
          transform: 'scale(1.01)',
          zIndex: 10,
        },
        '&[data-potential-target="true"]': {
          boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
        }
      }}
      data-group-id={group.id}
      data-droppable-group
      data-unlocked={isUnlocked ? 'true' : 'false'}
      data-locked={!isUnlocked ? 'true' : 'false'}
      data-group-title={group.title}
    >
      {/* Group header with title, actions and indicators */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1
      }}>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: isUnlocked ? 'success.main' : 'warning.main', flexGrow: 1 }}>
            {group.title || 'Unnamed Group'} 
            {isUnlocked ? 
              <LockOpenIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} /> : 
              <LockIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
            }
            </Typography>
          
          {canDrop && (
          <Chip 
            size="small" 
              label="Drop here" 
              color="primary" 
              sx={{ ml: 2, fontWeight: 'bold', animation: 'pulse 1.5s infinite' }} 
              variant="filled"
            />
          )}
          {!canDrop && shouldHighlight && isUnlocked && (
            <Chip 
              size="small" 
              label="Drop blocks here" 
              color="success" 
              sx={{ ml: 2, fontWeight: 'normal', opacity: 0.7 }} 
              variant="outlined"
            />
            )}
      </Box>
      
        {/* Group actions */}
        <Box>
          <IconButton
            onClick={() => onToggleCollapse(group.id)}
            size="small"
            aria-label={isCollapsed ? "Expand group" : "Collapse group"}
            sx={{ mr: 1 }}
          >
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          
          {!isPreviewMode && onAddBlock && (
            <IconButton 
              onClick={() => onAddBlock(group.id)} 
              size="small" 
              color="primary"
              sx={{ mr: 1 }}
              disabled={!isUnlocked}
            >
              <AddIcon />
            </IconButton>
          )}
          
          {!isPreviewMode && (
            <>
              <IconButton 
                onClick={() => onEdit(group)} 
                size="small" 
                color="primary"
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              
              <IconButton 
                onClick={() => onDelete(group.id)} 
            size="small" 
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      
      {/* Group content */}
      <Box sx={{ 
        flexGrow: 1,
        // Add a visual guide when collapsed
        ...(isCollapsed ? {
          height: '40px',
          position: 'relative',
          '&::after': {
            content: '"Group content is collapsed"',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'text.disabled',
            fontSize: '0.8rem'
          }
        } : {})
      }}>
        {/* If content is not collapsed, render children */}
        {!isCollapsed && children}
      </Box>
      
      {/* Drop indicator overlay */}
      {canDrop && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(33, 150, 243, 0.15)',
          border: '3px dashed #2196f3',
          zIndex: 2,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
            Drop to Add to Group
          </Typography>
        </Box>
      )}
    </Paper>
  );
});

// Add this interface to fix TypeScript errors
interface DraggableGroupContentProps {
  blocks: Block[];
  isNested: boolean;
  onReorder: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock?: (groupId: string) => void;
  isPreviewMode: boolean;
  containerId: string;
  groupId: string;
  unlockedGroups: Set<string>;
  onToggleGroupLock?: (groupId: string) => void;
  useDndContext: boolean;
  initialCollapsedBlocks: Set<string>;
  onToggleBlockCollapse: (blockId: string) => void;
  isUnlocked: boolean;
}

// Add this near where we define GroupDropZone - this will make group contents draggable
const DraggableGroupContent: React.FC<DraggableGroupContentProps> = ({ 
  blocks, 
  isNested, 
  onReorder, 
  onEdit, 
  onDelete, 
  onAddBlock, 
  isPreviewMode,
  containerId,
  groupId,
  unlockedGroups,
  onToggleGroupLock,
  useDndContext,
  initialCollapsedBlocks,
  onToggleBlockCollapse,
  isUnlocked
}) => {
  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      padding: 1,
      paddingBottom: 2,
      // Use a different background color for unlocked groups
      backgroundColor: isUnlocked ? 'rgba(76, 175, 80, 0.05)' : 'transparent'
    }}>
      {/* Only render BlockListNew to handle the blocks */}
      {blocks.length > 0 ? (
        <BlockListNew
          blocks={blocks}
          onReorder={onReorder}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddBlock={onAddBlock}
          isPreviewMode={isPreviewMode}
          isNested={isNested}
          containerId={containerId}
          groupId={groupId}
          unlockedGroups={unlockedGroups}
          onToggleGroupLock={onToggleGroupLock}
          useDndContext={useDndContext}
          initialCollapsedBlocks={initialCollapsedBlocks}
          onToggleBlockCollapse={onToggleBlockCollapse}
        />
      ) : (
        <Box sx={{ 
          p: 2, 
          textAlign: 'center', 
          color: 'text.secondary',
          fontStyle: 'italic',
          fontSize: '0.85rem'
        }}>
          {isUnlocked ? 
            'This group is empty. Add blocks using the + button above.' : 
            'This group is empty. Drag blocks here or add blocks using the + button.'
          }
        </Box>
      )}
    </Box>
  );
};

export const NestedBlockList: React.FC<NestedBlockListProps> = ({
  blocks,
  onBlocksChange,
  onEdit,
  onDelete,
  onAddBlock,
  isPreviewMode = false,
  unlockedGroups = new Set<string>(),
  onToggleGroupLock = () => {}
}) => {
  // Track active drag state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  
  // Get all blocks (including those in groups) for initial collapse state
  const getAllBlocks = (blocksList: Block[]): Block[] => {
    let result: Block[] = [];
    
    for (const block of blocksList) {
      result.push(block);
      if (block.type === 'group') {
        const groupBlock = block as BlockGroup;
        if (groupBlock.blocks && groupBlock.blocks.length > 0) {
          result = result.concat(getAllBlocks(groupBlock.blocks));
        }
      }
    }
    
    return result;
  };
  
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    // First block should be collapsed by default, others should be visible
    const groupBlocks = blocks.filter(block => block.type === 'group') as BlockGroup[];
    if (groupBlocks.length === 0) {
      // No groups, nothing to collapse
      return new Set<string>();
    } else {
      // Only the first block should be collapsed
      return new Set<string>([groupBlocks[0].id]);
    }
  });
  
  // Update collapsed groups when block array changes
  useEffect(() => {
    const groupBlocks = blocks.filter(block => block.type === 'group') as BlockGroup[];
    
    // If there are any groups, make sure only the first one is collapsed
    if (groupBlocks.length > 0) {
      const firstGroupId = groupBlocks[0].id;
      
      // Check if our current state matches what we want
      const onlyFirstGroupCollapsed = collapsedGroups.has(firstGroupId) && 
        collapsedGroups.size === 1;
      
      if (!onlyFirstGroupCollapsed) {
        // Only the first group should be collapsed
        setCollapsedGroups(new Set<string>([firstGroupId]));
      }
    } else {
      // No groups - nothing should be collapsed
      if (collapsedGroups.size > 0) {
        setCollapsedGroups(new Set());
      }
    }
  }, [blocks]);
  
  // Track which blocks are collapsed (not groups, but individual blocks)
  // IMPORTANT: Blocks IN the collapsedBlocks set are actually COLLAPSED (not expanded)
  // Being in the set = collapsed, not in the set = expanded
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(() => {
    // First block should be visible (NOT in collapsedBlocks)
    // All other blocks should be collapsed (IN collapsedBlocks)
    const topLevelBlocks = blocks;
    if (topLevelBlocks.length <= 1) {
      return new Set<string>();
    } else {
      // Add all blocks EXCEPT the first to the set (to make them collapsed)
      const collapsedSet = new Set<string>();
      for (let i = 1; i < topLevelBlocks.length; i++) {
        collapsedSet.add(topLevelBlocks[i].id);
      }
      return collapsedSet;
    }
  });
  
  // Update collapsed blocks when block array changes
  useEffect(() => {
    const topLevelBlocks = blocks;
    
    if (topLevelBlocks.length <= 1) {
      setCollapsedBlocks(new Set());
      return;
    }
    
    // All blocks except first should be in collapsedBlocks (to make them collapsed)
    const properState = new Set<string>();
    for (let i = 1; i < topLevelBlocks.length; i++) {
      properState.add(topLevelBlocks[i].id);
    }
    
    // Check if current state matches what we want
    let needsUpdate = false;
    
    // First block should NOT be in collapsedBlocks (to keep it visible)
    if (collapsedBlocks.has(topLevelBlocks[0].id)) {
      needsUpdate = true;
    }
    
    // All other blocks SHOULD be in collapsedBlocks (to keep them collapsed)
    for (let i = 1; i < topLevelBlocks.length; i++) {
      if (!collapsedBlocks.has(topLevelBlocks[i].id)) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      setCollapsedBlocks(properState);
    }
  }, [blocks]);
  
  // Handle toggling block collapse state
  const handleToggleBlockCollapse = (blockId: string) => {
    setCollapsedBlocks(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(blockId)) {
        newCollapsed.delete(blockId);
      } else {
        newCollapsed.add(blockId);
      }
      return newCollapsed;
    });
  };
  
  // Track container relationships - used for moving items between containers
  const [containers, setContainers] = useState(() => {
    const containerMap = new Map<string, string[]>();
    
    // Initialize top-level container with non-group blocks
    containerMap.set(
      TOP_LEVEL_CONTAINER, 
      blocks.filter(b => b.type !== 'group').map(b => b.id)
    );
    
    // Initialize each group container with its blocks
    blocks
      .filter(b => b.type === 'group')
      .forEach(group => {
        const groupBlocks = (group as BlockGroup).blocks || [];
        containerMap.set(
          `${GROUP_CONTAINER_PREFIX}${group.id}`,
          groupBlocks.map(b => b.id)
        );
      });
    
    return containerMap;
  });
  
  // Update container relationships when blocks change
  useEffect(() => {
    const containerMap = new Map<string, string[]>();
    
    // Initialize top-level container with non-group blocks
    containerMap.set(
      TOP_LEVEL_CONTAINER, 
      blocks.filter(b => b.type !== 'group').map(b => b.id)
    );
    
    // Initialize each group container with its blocks
    blocks
      .filter(b => b.type === 'group')
      .forEach(group => {
        const groupBlocks = (group as BlockGroup).blocks || [];
        containerMap.set(
          `${GROUP_CONTAINER_PREFIX}${group.id}`,
          groupBlocks.map(b => b.id)
        );
      });
    
    setContainers(containerMap);
  }, [blocks]);
  
  // Extract group blocks and non-group blocks
  const groupBlocks = blocks.filter((b: Block) => b.type === 'group') as BlockGroup[];
  const nonGroupBlocks = blocks.filter((b: Block) => b.type !== 'group');
  
  // Determine if any groups are unlocked
  const hasUnlockedGroups = groupBlocks.some((group: BlockGroup) => unlockedGroups.has(group.id));
  
  // Handle toggling group collapse state
  const handleToggleGroupCollapse = (groupId: string) => {
    const newCollapsedGroups = new Set(collapsedGroups);
    if (newCollapsedGroups.has(groupId)) {
      newCollapsedGroups.delete(groupId);
    } else {
      newCollapsedGroups.add(groupId);
    }
    setCollapsedGroups(newCollapsedGroups);
  };

  // Check if a group is collapsed
  const isGroupCollapsed = (groupId: string) => {
    return collapsedGroups.has(groupId);
  };
  
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

  // Custom collision detection that prioritizes groups
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      console.log('Collision detection running with active:', args.active.id);
      
      // First try closestCorners which is better for larger drop targets
      const closestIntersections = closestCorners(args);
      console.log('Found closest intersections:', closestIntersections.map(i => i.id));
      
      // If that doesn't work, try rectIntersection
      if (!closestIntersections.length) {
        const rectIntersections = rectIntersection(args);
        console.log('Using rect intersections:', rectIntersections.map(i => i.id));
        
        // If still nothing, use pointerWithin as a last resort
        if (!rectIntersections.length) {
          const pointerIntersections = pointerWithin(args);
          console.log('Using pointer intersections:', pointerIntersections.map(i => i.id));
          return pointerIntersections;
        }
        
        return rectIntersections;
      }
      
      // Get active item - we only care about blocks
      const activeData = args.active.data.current;
      if (!activeData || activeData.type !== 'block') {
        console.log('Not dragging a block, returning all intersections');
        return closestIntersections;
      }
      
      // Find all group intersections
      const groupIntersections = closestIntersections.filter(
        (collision) => String(collision.id).startsWith(GROUP_CONTAINER_PREFIX)
      );
      
      console.log('Group intersections:', groupIntersections.map(i => i.id));
      
      // If we have group intersections and the active item is a block, prioritize groups
      if (groupIntersections.length > 0) {
        const targetGroupId = String(groupIntersections[0].id).replace(GROUP_CONTAINER_PREFIX, '');
        console.log(`Prioritizing group intersection: ${targetGroupId}`);
        
        // FIXED: Check if group is LOCKED (not unlocked)
        if (!unlockedGroups.has(targetGroupId)) {
          console.log(`Group ${targetGroupId} is locked, can drop here`);
          return [groupIntersections[0]];
    } else {
          console.log(`Group ${targetGroupId} is unlocked, cannot drop here`);
        }
      }
      
      // Fall back to default behavior
      return closestIntersections;
    },
    [unlockedGroups]
  );
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();
    const activeBlockItem = findBlockById(activeId);
    
    console.log(`Drag started for block: ${activeId}`, active.data?.current);
    
    setActiveId(active.id);
    if (activeBlockItem) {
      setActiveBlock(activeBlockItem);
      
      // Set the global drag state for other components to detect
      document.body.setAttribute('data-dragging-block-id', activeId);
      document.body.setAttribute('data-dragging-block-type', activeBlockItem.type);
      document.body.classList.add('dragging-active');
      
      // Force all droppable groups to high z-index during drag
      document.querySelectorAll('[data-droppable-group][data-unlocked="true"]').forEach(el => {
        el.setAttribute('data-during-drag', 'true');
      });
      
      // Add active class to the dragged element
      const draggedElement = document.querySelector(`[data-block-id="${activeId}"]`);
      if (draggedElement) {
        draggedElement.classList.add('actively-dragging');
      }
    }
  };
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      console.log('Dragging but not over any target');
          return;
        }
        
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    console.log(`Dragging ${activeId} over ${overId}`);
    
    // Skip if dropping onto itself
    if (activeId === overId) return;
    
    // Check if we're dropping on a group container
    if (overId.startsWith(GROUP_CONTAINER_PREFIX)) {
      const groupId = overId.replace(GROUP_CONTAINER_PREFIX, '');
      
      console.log(`Hovering over group: ${groupId}`);
      
      // FIXED: Check if the group is LOCKED (not unlocked)
      if (!unlockedGroups.has(groupId)) {
        console.log(`Group ${groupId} is locked, valid drop target`);
        
        // Add a data attribute to indicate valid drop target
        const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
        if (groupElement) {
          groupElement.setAttribute('data-valid-drop-target', 'true');
          
          // Highlight all LOCKED groups as potential targets
          document.querySelectorAll('[data-droppable-group][data-locked="true"]').forEach(el => {
            if (el !== groupElement) {
              el.setAttribute('data-potential-target', 'true');
            }
          });
        }
      } else {
        console.log(`Group ${groupId} is unlocked, cannot drop here`);
      }
    }
  };
  
  // Find the container a block belongs to
  const findContainer = (blockId: string) => {
    for (const [containerId, items] of containers.entries()) {
      if (items.includes(blockId)) {
        return containerId;
      }
    }
    return null;
  };
  
  // Find a block by ID in the blocks array
  const findBlockById = (blockId: string): Block | null => {
    // First check top level blocks
    const topLevelBlock = blocks.find(b => b.id === blockId);
    if (topLevelBlock) return topLevelBlock;
    
    // Then check in groups
    for (const group of blocks.filter(b => b.type === 'group') as BlockGroup[]) {
      if (group.blocks) {
        const nestedBlock = group.blocks.find(b => b.id === blockId);
        if (nestedBlock) return nestedBlock;
      }
    }
    
    return null;
  };
  
  // Update block order in the current container
  const handleDragMove = (activeId: string, overId: string) => {
    // Find which container both items belong to
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    
    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return false;
    }
    
    const activeItems = containers.get(activeContainer) || [];
    const activeIndex = activeItems.indexOf(activeId);
    const overIndex = activeItems.indexOf(overId);
    
    if (activeIndex === -1 || overIndex === -1) {
      return false;
    }
    
    // If the order changed, update the container items
    if (activeIndex !== overIndex) {
      setContainers(prev => {
        const containerMap = new Map(prev);
        const newItems = arrayMove(activeItems, activeIndex, overIndex);
        containerMap.set(activeContainer, newItems);
        return containerMap;
      });
      return true;
    }
    
    return false;
  };
  
  // Handle drag end - finalize any reordering or moving blocks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log(`Drag ended, active: ${active?.id}, over: ${over?.id}`);
    console.log(`Over data:`, over?.data?.current);
    
    // Clean up any drag state
    document.body.removeAttribute('data-dragging-block-id');
    document.body.removeAttribute('data-dragging-block-type');
    document.body.classList.remove('dragging-active');
    
    // Remove during-drag attributes
    document.querySelectorAll('[data-during-drag]').forEach(el => {
      el.removeAttribute('data-during-drag');
    });
    
    // Remove actively-dragging class
    document.querySelectorAll('.actively-dragging').forEach(el => {
      el.classList.remove('actively-dragging');
    });
    
    // Remove all drop target indicators
    document.querySelectorAll('[data-valid-drop-target]').forEach(el => {
      el.removeAttribute('data-valid-drop-target');
    });
    
    document.querySelectorAll('[data-potential-target]').forEach(el => {
      el.removeAttribute('data-potential-target');
    });
    
    // Reset active states
    setActiveId(null);
    setActiveBlock(null);
    
    // Get the active block ID
    const activeId = active.id.toString();
    
    // Get the source container for the active item
    const activeContainer = findContainer(activeId);
    console.log(`Source container: ${activeContainer}`);
    
    // Check if we're dragging from a group
    const isFromGroup = activeContainer && activeContainer.startsWith(GROUP_CONTAINER_PREFIX);
    
    // If no valid drop target or over is undefined, but we're dragging from a group,
    // move the block to the top level by default
    if (!over && isFromGroup) {
      console.log('No drop target found, but block was from a group. Moving to top level by default.');
      moveBlockFromGroupToTopLevel(activeId);
      return;
    }
    
    if (!over) {
      console.log('No valid drop target found');
      return;
    }
    
    const overId = over.id.toString();
    
    console.log(`Drop completed: ${activeId} onto ${overId}`);
    console.log(`Container for over target: ${findContainer(overId)}`);
    
    // Skip if dropping onto itself
    if (activeId === overId) {
      console.log('Dropped onto self, ignoring');
      return;
    }
    
    // Case 1: Dropping onto a group container
    if (overId.startsWith(GROUP_CONTAINER_PREFIX)) {
      const targetGroupId = overId.replace(GROUP_CONTAINER_PREFIX, '');
      console.log(`Dropping onto group container: ${targetGroupId}`);
      
      const groupBlock = blocks.find(b => b.id === targetGroupId && b.type === 'group') as BlockGroup | undefined;
      
      // Verify the group exists and is LOCKED (not unlocked)
      if (groupBlock && !unlockedGroups.has(targetGroupId)) {
        console.log(`Group ${targetGroupId} exists and is locked`);
        
        // This is the key method that moves a block to a group
        moveBlockToGroup(activeId, targetGroupId);
        
        // Log successful drop
        console.log(`Successfully moved block ${activeId} to group ${targetGroupId}`);
        return;
      } else {
        console.log(`Group ${targetGroupId} doesn't exist or is unlocked`);
        // If group is unlocked but we're dragging from a group, move to top level
        if (isFromGroup) {
          console.log('Group is unlocked, moving block to top level instead');
          moveBlockFromGroupToTopLevel(activeId);
          return;
        }
      }
    }
    // Case 2: Dropping onto another block in the same container
    else if (activeContainer && findContainer(overId) === activeContainer) {
      console.log(`Reordering within same container: ${activeContainer}`);
      
      const orderChanged = handleDragMove(activeId, overId);
      
      if (orderChanged) {
        console.log('Order changed, updating blocks');
        // Update the actual blocks array based on the new container order
        updateBlocksFromContainers();
      }
    } 
    // Case 3: Moving a block from a group to the top level
    else if (isFromGroup && findContainer(overId) === TOP_LEVEL_CONTAINER) {
      console.log(`Moving block from group to top level: ${activeId}`);
      
      // Move the block from its group to the top level
      moveBlockFromGroupToTopLevel(activeId);
      return;
    }
    // Case 4: Moving a block from a group to somewhere else - default to top level
    else if (isFromGroup) {
      console.log(`Moving block from group to default top level: ${activeId}`);
      moveBlockFromGroupToTopLevel(activeId);
      return;
    }
    else {
      console.log(`Drop target container mismatch: active=${activeContainer}, over=${findContainer(overId)}`);
    }
  };
  
  // Move a block to a specific group
  const moveBlockToGroup = (blockId: string, groupId: string) => {
    console.log(`Moving block ${blockId} to group ${groupId}`);
    
    // FIXED: Ensure the group is LOCKED (not unlocked)
    if (unlockedGroups.has(groupId)) {
      console.error(`Cannot move block to unlocked group: ${groupId}`);
      return;
    }
    
    // Make a copy of all blocks
    const updatedBlocks = [...blocks];
    
    // Find the block to move
    const blockToMove = findBlockById(blockId);
    if (!blockToMove) {
      console.error("Block to move not found:", blockId);
      return;
    }
    
    console.log("Found block to move:", blockToMove);
    
    // Ensure the group exists and is locked (not unlocked)
    const targetGroup = updatedBlocks.find(
      b => b.id === groupId && b.type === 'group'
    ) as BlockGroup | undefined;
    
    if (!targetGroup) {
      console.error("Target group not found:", groupId);
      return;
    }
    
    // FIXED: This check is now redundant with the one above
    // We already verified that the group is locked (not unlocked)
    
    console.log("Found target group:", targetGroup);
    
    // Remove the block from its current location
    const sourceContainer = findContainer(blockId);
    let blockWasRemoved = false;
    
    console.log("Removing block from source container:", sourceContainer);
    
    if (sourceContainer === TOP_LEVEL_CONTAINER) {
      // Remove from top level
      const blockIndex = updatedBlocks.findIndex(b => b.id === blockId);
      if (blockIndex >= 0) {
        console.log(`Removing block from top level at index ${blockIndex}`);
        updatedBlocks.splice(blockIndex, 1);
        blockWasRemoved = true;
      }
    } else if (sourceContainer?.startsWith(GROUP_CONTAINER_PREFIX)) {
      // Remove from source group
      const sourceGroupId = sourceContainer.replace(GROUP_CONTAINER_PREFIX, '');
      const sourceGroup = updatedBlocks.find(b => b.id === sourceGroupId && b.type === 'group') as BlockGroup | undefined;
      
      if (sourceGroup && sourceGroup.blocks) {
        const initialLength = sourceGroup.blocks.length;
        console.log(`Removing block from group ${sourceGroupId} with initial blocks length ${initialLength}`);
        sourceGroup.blocks = sourceGroup.blocks.filter(b => b.id !== blockId);
        blockWasRemoved = sourceGroup.blocks.length < initialLength;
        console.log(`After removal, group has ${sourceGroup.blocks.length} blocks`);
      }
    }
    
    if (!blockWasRemoved) {
      console.warn("Block was not found in its expected container:", blockId);
      // We'll still attempt to add it to the target group
    }
    
    // Create a clean copy of the block to avoid reference issues
    const blockCopy = JSON.parse(JSON.stringify(blockToMove));
    
    // Add to target group - ensure blocks array exists
    if (!targetGroup.blocks) {
      targetGroup.blocks = [];
    }
    
    // Make sure the block has proper minimum properties
    if (!blockCopy.id) blockCopy.id = blockId;
    if (!blockCopy.order) blockCopy.order = targetGroup.blocks.length;
    
    // Add the block to the target group
    targetGroup.blocks.push(blockCopy);
    console.log(`Added block to group ${groupId}. Group now has ${targetGroup.blocks.length} blocks`);
    
    console.log("Updated blocks structure:", updatedBlocks);
    
    // Verify that the block was added properly
    const verifyGroupContainsBlock = updatedBlocks.find(
      b => b.id === groupId && b.type === 'group'
    ) as BlockGroup | undefined;
    
    if (verifyGroupContainsBlock && verifyGroupContainsBlock.blocks) {
      const blockAdded = verifyGroupContainsBlock.blocks.some(b => b.id === blockId);
      console.log(`Verification: block added to group = ${blockAdded}`);
    }
    
    // Update the blocks array
    onBlocksChange(updatedBlocks);
    
    // Update the containers map to reflect the change
    setContainers(prev => {
      const containerMap = new Map(prev);
      
      // Remove from source container if found
      if (sourceContainer) {
        const sourceItems = containerMap.get(sourceContainer) || [];
        containerMap.set(
          sourceContainer, 
          sourceItems.filter(id => id !== blockId)
        );
      }
      
      // Add to target container
      const targetContainerId = `${GROUP_CONTAINER_PREFIX}${groupId}`;
      const targetItems = containerMap.get(targetContainerId) || [];
      containerMap.set(
        targetContainerId,
        [...targetItems, blockId]
      );
      
      return containerMap;
    });
  };
  
  // Update the blocks array based on the current container state
  const updateBlocksFromContainers = () => {
    // Create a new blocks array with the updated order
    const updatedBlocks: Block[] = [];
    
    // Handle top-level blocks
    const topLevelIds = containers.get(TOP_LEVEL_CONTAINER) || [];
    for (const id of topLevelIds) {
      const block = findBlockById(id);
      if (block) {
        updatedBlocks.push(block);
      }
    }
    
    // Handle groups and their blocks
    for (const group of groupBlocks) {
      const groupContainer = `${GROUP_CONTAINER_PREFIX}${group.id}`;
      const groupBlockIds = containers.get(groupContainer) || [];
      
      // Create a copy of the group with its blocks in the correct order
      const updatedGroup: BlockGroup = { ...group, blocks: [] };
      
      for (const id of groupBlockIds) {
        const block = findBlockById(id);
        if (block) {
          updatedGroup.blocks.push(block);
        }
      }
      
      updatedBlocks.push(updatedGroup);
    }
    
    // Update the block array
    onBlocksChange(updatedBlocks);
  };
  
  // New function to move a block from a group to the top level
  const moveBlockFromGroupToTopLevel = (blockId: string) => {
    console.log(`Moving block ${blockId} from group to top level`);
    
    // Make a copy of all blocks
    const updatedBlocks = [...blocks];
    
    // Find the block to move
    const blockToMove = findBlockById(blockId);
    if (!blockToMove) {
      console.error("Block to move not found:", blockId);
      return;
    }
    
    console.log("Found block to move:", blockToMove);
    
    // Find the source group
    const sourceContainer = findContainer(blockId);
    if (!sourceContainer || !sourceContainer.startsWith(GROUP_CONTAINER_PREFIX)) {
      console.error("Block is not in a group container:", blockId);
      return;
    }
    
    const sourceGroupId = sourceContainer.replace(GROUP_CONTAINER_PREFIX, '');
    console.log(`Source group: ${sourceGroupId}`);
    
    // Find the source group in the blocks array
    const sourceGroupIndex = updatedBlocks.findIndex(b => b.id === sourceGroupId && b.type === 'group');
    if (sourceGroupIndex === -1) {
      console.error("Source group not found:", sourceGroupId);
      return;
    }
    
    const sourceGroup = updatedBlocks[sourceGroupIndex] as BlockGroup;
    if (!sourceGroup.blocks) {
      console.error("Source group has no blocks array:", sourceGroupId);
      return;
    }
    
    // Remove the block from the source group
    const blockIndex = sourceGroup.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      console.error("Block not found in source group:", blockId);
      return;
    }
    
    // Create a clean copy of the block to avoid reference issues
    const blockCopy = JSON.parse(JSON.stringify(blockToMove));
    
    // Remove the block from the source group
    sourceGroup.blocks.splice(blockIndex, 1);
    console.log(`Removed block from group. Group now has ${sourceGroup.blocks.length} blocks`);
    
    // Add the block to the top level
    updatedBlocks.unshift(blockCopy); // Add to the beginning
    console.log("Added block to top level");
    
    // Update the blocks array
    onBlocksChange(updatedBlocks);
    
    // Update the containers map to reflect the change
    setContainers(prev => {
      const containerMap = new Map(prev);
      
      // Remove from source container
      const sourceItems = containerMap.get(sourceContainer) || [];
      containerMap.set(
        sourceContainer, 
        sourceItems.filter(id => id !== blockId)
      );
      
      // Add to top level container
      const topLevelItems = containerMap.get(TOP_LEVEL_CONTAINER) || [];
      containerMap.set(
        TOP_LEVEL_CONTAINER,
        [blockId, ...topLevelItems] // Add to the beginning
      );
      
      return containerMap;
    });
  };
  
  const BlockItem = React.memo(({ block, index }: { block: Block; index: number }) => {
    const isGroup = block.type === 'group';
    const groupId = block.id;
    const isGroupBlock = isGroup && groupId !== undefined;
    const isUnlocked = isGroupBlock ? unlockedGroups.has(groupId) : false;
    
    // Make blocks draggable regardless of their group's lock status
    // This enables dragging blocks out of groups even when the group is unlocked
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: block.id,
      data: {
        type: 'block',
        block,
        index
      },
      // Allow dragging out of a group regardless of its lock status
      disabled: isPreviewMode
    });
  
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{
          transform: transform ? CSS.Transform.toString(transform) : undefined,
          padding: '0.25rem',
          border: '1px dashed transparent',
          backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          cursor: 'move',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {block.title}
      </div>
    );
  });
  
    return (
    <DragContext.Provider value={{ activeId, isDragging: activeId !== null }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
      >
        <Box>
          {/* Render section for non-group blocks */}
          {nonGroupBlocks.length > 0 ? (
      <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Top-Level Blocks
              </Typography>
              
              {/* Non-group blocks are always in a droppable context */}
              <BlockListNew
                blocks={nonGroupBlocks}
                onReorder={(reorderedBlocks) => {
                  // Create a new blocks array with the updated top-level blocks and existing groups
                  const updatedBlocks = [...groupBlocks, ...reorderedBlocks];
                  onBlocksChange(updatedBlocks);
                }}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddBlock={onAddBlock}
                isPreviewMode={isPreviewMode}
                containerId={TOP_LEVEL_CONTAINER}
                unlockedGroups={unlockedGroups}
                onToggleGroupLock={onToggleGroupLock}
                useDndContext={false} // Don't create a new DndContext
                initialCollapsedBlocks={collapsedBlocks}
                onToggleBlockCollapse={handleToggleBlockCollapse}
              />
      </Box>
          ) : (
            <Paper elevation={0} sx={{ p: 2, mb: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
              <Typography variant="body2" color="text.secondary">
                No top-level blocks yet. Add blocks or create groups to organize your content.
              </Typography>
            </Paper>
          )}

          {/* Group blocks - always show groups, but in different modes */}
          {groupBlocks.map(group => (
            <GroupDropZone
        key={group.id}
        group={group}
              blocks={blocks}
              isCollapsed={isGroupCollapsed(group.id)}
              onToggleCollapse={handleToggleGroupCollapse}
              onEdit={onEdit}
              onDelete={onDelete}
              isPreviewMode={isPreviewMode}
              onAddBlock={onAddBlock}
              isUnlocked={unlockedGroups.has(group.id)}
            >
              {/* Group content - conditionally rendered based on collapsed state */}
              {!isGroupCollapsed(group.id) && (
                <DraggableGroupContent 
                  blocks={group.blocks || []}
                  isNested={true}
                  onReorder={(reorderedBlocks) => {
                    // Create a deep copy of all blocks
                    const updatedAllBlocks = [...blocks];
                    
                    // Find the group to update
                    const groupIndex = updatedAllBlocks.findIndex(b => b.id === group.id);
                    if (groupIndex >= 0) {
                      const groupBlock = updatedAllBlocks[groupIndex] as BlockGroup;
                      groupBlock.blocks = reorderedBlocks;
                    }
                    
                    // Update parent
                    onBlocksChange?.(updatedAllBlocks);
                  }}
      onEdit={onEdit}
      onDelete={onDelete}
                  onAddBlock={onAddBlock}
      isPreviewMode={isPreviewMode}
                  containerId={`${GROUP_CONTAINER_PREFIX}${group.id}`}
                  groupId={group.id}
                  unlockedGroups={unlockedGroups}
                  onToggleGroupLock={onToggleGroupLock}
                  useDndContext={false}
                  initialCollapsedBlocks={new Set()}
                  onToggleBlockCollapse={() => {}}
                  isUnlocked={unlockedGroups.has(group.id)}
                />
              )}
            </GroupDropZone>
          ))}

          {/* Info alert */}
          {groupBlocks.length > 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%">
          <Box>
                  <strong>Tip:</strong> {hasUnlockedGroups ? 
                    "Groups are now in edit mode. Blocks can't be dragged into unlocked groups." :
                    "Groups are in use mode. You can drag blocks into locked groups and from group to group."
            }
          </Box>
          <Box>
            <Button 
              variant="outlined" 
                    color={hasUnlockedGroups ? "warning" : "primary"}
              size="small"
                    onClick={() => {
                      // Toggle all groups' lock state
                      groupBlocks.forEach(group => {
                        onToggleGroupLock(group.id);
                      });
                    }}
                    startIcon={hasUnlockedGroups ? <LockIcon /> : <LockOpenIcon />}
                  >
                    {hasUnlockedGroups ? "Lock All Groups" : "Unlock All Groups"}
            </Button>
          </Box>
        </Stack>
      </Alert>
          )}
          
          {/* Drag overlay for visual feedback */}
          <DragOverlay>
            {activeId && activeBlock ? (
              <Box
                sx={{
                  opacity: 0.8,
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                  transform: 'rotate(3deg)',
                  pointerEvents: 'none',
                  width: '100%',
                  maxWidth: '500px',
                }}
              >
                <BlockRendererNew
                  block={activeBlock}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isPreviewMode={false}
                  isDraggable={false}
                  isCollapsed={collapsedBlocks.has(activeBlock.id)}
                  onToggleCollapse={handleToggleBlockCollapse}
                />
    </Box>
            ) : null}
          </DragOverlay>
    </Box>
      </DndContext>
    </DragContext.Provider>
  );
};