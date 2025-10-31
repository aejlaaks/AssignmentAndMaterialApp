import React, { useState, useCallback } from 'react';
import { Box, Paper, Typography, Divider, Alert, Stack, Chip, Button } from '@mui/material';
import { Block, BlockGroup } from '../../types/blocks';
import { BlockRendererNew } from './BlockRendererNew';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { BlockListNew } from './BlockListNew';

interface NativeNestedBlockListProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
}

// Native drag-and-drop version of the GroupBlock component
const NativeDragGroupBlock = ({ 
  group, 
  onDrop,
  children,
  isDragging
}: { 
  group: BlockGroup, 
  onDrop: (blockId: string, groupId: string) => void,
  children: React.ReactNode,
  isDragging: boolean
}) => {
  const [isOver, setIsOver] = useState(false);

  // Handle native drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    // Get block ID from dataTransfer
    const blockId = e.dataTransfer.getData('text/plain');
    console.log(`Dropping block ${blockId} onto group ${group.id}`);
    
    if (blockId) {
      onDrop(blockId, group.id);
    }
  };
  
  // Visual state for highlighting
  const isHighlighted = isOver && isDragging;

  return (
    <Paper 
      elevation={isHighlighted ? 4 : 2}
      sx={{ 
        mt: 3, 
        p: 2,
        border: isHighlighted ? '2px dashed #2196f3' : '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
        backgroundColor: isHighlighted ? 'rgba(33, 150, 243, 0.08)' : 'white',
        position: 'relative',
        zIndex: isHighlighted ? 2 : 1,
        minHeight: '150px',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box 
        sx={{ 
          mb: 1, 
          p: 2, 
          bgcolor: isHighlighted ? 'rgba(33, 150, 243, 0.15)' : '#f5f5f5',
          borderRadius: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="primary">
              {group.title}
              {isHighlighted && <span style={{ color: '#2196f3', marginLeft: '8px' }}>
                (Drop to add)
              </span>}
            </Typography>
            {group.description && (
              <Typography variant="body2" color="text.secondary">
                {group.description}
              </Typography>
            )}
          </Box>
          
          <Chip 
            label={isHighlighted ? "Drop Here!" : "Group"} 
            size="small" 
            color={isHighlighted ? "primary" : "default"} 
            variant={isHighlighted ? "filled" : "outlined"}
          />
        </Stack>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {children}
      
      {group.blocks.length === 0 && (
        <Box 
          sx={{ 
            py: 2, 
            textAlign: 'center', 
            bgcolor: '#f9f9f9',
            borderRadius: 1,
            border: '1px dashed #ccc',
            mt: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {isHighlighted 
              ? "Release to add block here" 
              : "This group is empty. Drag blocks here to add content."}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Native drag-and-drop version of the BlockItem component
const NativeDragBlockItem = ({ 
  block, 
  onEdit,
  onDelete,
  isPreviewMode,
  onDragStart,
  onDragEnd,
  isDraggable = true
}: { 
  block: Block, 
  onEdit: (block: Block) => void,
  onDelete: (blockId: string) => void,
  isPreviewMode: boolean,
  onDragStart: (blockId: string) => void,
  onDragEnd: () => void,
  isDraggable?: boolean
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Set the block ID as data
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Notify parent component
    onDragStart(block.id);
  };
  
  const handleDragEnd = () => {
    onDragEnd();
  };
  
  return (
    <Box
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      sx={{ 
        cursor: isDraggable ? 'grab' : 'default',
        mb: 2 
      }}
    >
      <BlockRendererNew
        block={block}
        onEdit={onEdit}
        onDelete={onDelete}
        isPreviewMode={isPreviewMode}
      />
    </Box>
  );
};

export const NativeNestedBlockList: React.FC<NativeNestedBlockListProps> = ({
  blocks,
  onBlocksChange,
  onEdit,
  onDelete,
  isPreviewMode = false
}) => {
  // State to track if something is being dragged
  const [isDragging, setIsDragging] = useState(false);
  // State to track current dragged block ID
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  // State for toggling group editing mode
  const [areGroupsEditable, setAreGroupsEditable] = useState(false);
  
  // Extract regular blocks and group blocks for easier rendering
  const regularBlocks = blocks.filter(block => block.type !== 'group');
  const groupBlocks = blocks.filter(block => block.type === 'group') as BlockGroup[];
  
  // Handle drag start
  const handleDragStart = useCallback((blockId: string) => {
    console.log(`Drag started: ${blockId}`);
    setDraggedBlockId(blockId);
    setIsDragging(true);
  }, []);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    console.log('Drag ended');
    setDraggedBlockId(null);
    setIsDragging(false);
  }, []);
  
  // Handle dropping a block on a group
  const handleDropOnGroup = useCallback((blockId: string, groupId: string) => {
    console.log(`Processing drop of ${blockId} onto group ${groupId}`);
    
    // Clone blocks array for immutability
    const newBlocks = [...blocks];
    
    // Find if the block is currently in a group or at the root level
    let blockToMove: Block | null = null;
    let sourceGroupId: string | null = null;
    
    // Check if block is at root level
    const rootBlockIndex = newBlocks.findIndex(b => b.id === blockId);
    if (rootBlockIndex >= 0) {
      blockToMove = { ...newBlocks[rootBlockIndex] };
      // Remove from root
      newBlocks.splice(rootBlockIndex, 1);
    } else {
      // Search in groups
      for (const block of newBlocks) {
        if (block.type === 'group') {
          const group = block as BlockGroup;
          const blockIndex = group.blocks.findIndex(b => b.id === blockId);
          
          if (blockIndex >= 0) {
            blockToMove = { ...group.blocks[blockIndex] };
            sourceGroupId = group.id;
            
            // Remove from source group
            group.blocks.splice(blockIndex, 1);
            break;
          }
        }
      }
    }
    
    // Skip if trying to drop into the same group (no-op)
    if (sourceGroupId === groupId) {
      console.log('Block is already in this group, skipping');
      return;
    }
    
    // If block was found, add it to the target group
    if (blockToMove) {
      // Find the target group
      const targetGroup = newBlocks.find(b => b.id === groupId) as BlockGroup | undefined;
      
      if (targetGroup) {
        // Add to target group
        targetGroup.blocks.push(blockToMove);
        
        // Apply changes
        onBlocksChange([...newBlocks]);
        console.log('Block moved successfully');
      } else {
        console.error(`Target group ${groupId} not found`);
      }
    } else {
      console.error(`Block ${blockId} not found`);
    }
  }, [blocks, onBlocksChange]);
  
  // Render the fixed version with native drag and drop
  const renderFixedView = () => (
    <>
      {/* Render regular blocks */}
      <Box sx={{ mb: 3 }}>
        {regularBlocks.map(block => (
          <NativeDragBlockItem
            key={block.id}
            block={block}
            onEdit={onEdit}
            onDelete={onDelete}
            isPreviewMode={isPreviewMode}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDraggable={true}
          />
        ))}
      </Box>
      
      {/* Render group blocks */}
      <Box>
        {groupBlocks.map(group => (
          <NativeDragGroupBlock
            key={group.id}
            group={group}
            onDrop={handleDropOnGroup}
            isDragging={isDragging}
          >
            {group.blocks.map(block => (
              <NativeDragBlockItem
                key={block.id}
                block={block}
                onEdit={onEdit}
                onDelete={onDelete}
                isPreviewMode={isPreviewMode}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDraggable={true}
              />
            ))}
          </NativeDragGroupBlock>
        ))}
      </Box>
    </>
  );
  
  // Render the editable version using BlockListNew
  const renderEditableView = () => {
    // If we're in fixed mode, pass the group block IDs to exclude from draggable
    const excludeFromDraggable = !areGroupsEditable 
      ? groupBlocks.map(group => group.id) 
      : undefined;
      
    return (
      <BlockListNew
        blocks={blocks}
        onReorder={onBlocksChange}
        onEdit={onEdit}
        onDelete={onDelete}
        isPreviewMode={isPreviewMode}
        isNested={true}
        excludeFromDraggable={excludeFromDraggable}
      />
    );
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" width="100%">
          <Box>
            <strong>Tip:</strong> {areGroupsEditable ? 
              "Groups are now editable and can be dragged. This allows reorganizing your course structure." :
              "Groups are fixed drop targets. Drag any block and drop it directly onto a group to add it inside."
            }
          </Box>
          <Box>
            <Button 
              variant="outlined" 
              color={areGroupsEditable ? "warning" : "primary"}
              size="small"
              onClick={() => setAreGroupsEditable(!areGroupsEditable)}
              startIcon={areGroupsEditable ? <LockOpenIcon /> : <LockIcon />}
            >
              {areGroupsEditable ? "Lock Groups" : "Unlock Groups"}
            </Button>
          </Box>
        </Stack>
      </Alert>
      
      {areGroupsEditable ? renderEditableView() : renderFixedView()}
    </Box>
  );
};