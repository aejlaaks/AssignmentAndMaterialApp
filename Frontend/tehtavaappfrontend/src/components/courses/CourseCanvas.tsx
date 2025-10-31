import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  CreateNewFolder as CreateGroupIcon,
  AccountTree as TreeViewIcon,
} from '@mui/icons-material';
import { Block, BlockGroup } from '../../types/blocks';
import { useBlocks } from '../../hooks/useBlocks';
import { BlockListNew } from '../../components/blocks/BlockListNew';
import { NestedBlockList } from '../../components/blocks/NestedBlockList';
import { BlockDialog } from '../../components/blocks/BlockDialog';

interface CourseCanvasProps {
  courseId: string;
  initialBlocks?: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

// Create a stable ID generator
function generateStableId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const CourseCanvas: React.FC<CourseCanvasProps> = ({
  courseId,
  initialBlocks = [],
  onBlocksChange,
}) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks || []);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | undefined>(undefined);
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [useNestedView, setUseNestedView] = useState(true);
  
  // Add state for tracking unlocked groups
  const [unlockedGroups, setUnlockedGroups] = useState<Set<string>>(new Set());
  
  // Function to toggle group lock state
  const toggleGroupLock = (groupId: string) => {
    const newUnlockedGroups = new Set(unlockedGroups);
    if (newUnlockedGroups.has(groupId)) {
      newUnlockedGroups.delete(groupId);
    } else {
      newUnlockedGroups.add(groupId);
    }
    setUnlockedGroups(newUnlockedGroups);
  };
  
  // Function to check if a group is unlocked
  const isGroupUnlocked = (groupId: string) => {
    return unlockedGroups.has(groupId);
  };
  
  // Debug helpers
  useEffect(() => {
    const debugDraggables = () => {
      const elements = document.querySelectorAll('[data-block-id]');
      console.log(`Found ${elements.length} draggable elements`);
      elements.forEach(el => {
        console.log('Draggable:', el.getAttribute('data-block-id'));
      });
    };
    
    // @ts-ignore
    window.debugDraggables = debugDraggables;
    
    return () => {
      // @ts-ignore
      delete window.debugDraggables;
    };
  }, []);
  
  // Utility to clone blocks safely
  const cloneBlocks = (blocks: Block[]): Block[] => {
    return JSON.parse(JSON.stringify(blocks));
  };

  // Handle action menu click
  const handleActionsClick = (event: React.MouseEvent<HTMLElement>, groupId?: string) => {
    setActionAnchorEl(event.currentTarget);
    if (groupId) setSelectedGroupId(groupId);
  };
  
  // Handle menu close
  const handleActionsClose = () => {
    setActionAnchorEl(null);
  };
  
  // Handle adding a block to a group
  const handleAddBlockToGroup = (groupId: string) => {
    console.log(`Adding block to group: ${groupId}`);
    setSelectedGroupId(groupId);
    setEditingBlock({ groupId } as any); // Pass groupId in editingBlock
    setBlockDialogOpen(true);
    handleActionsClose();
  };

  // Clear the group context before adding a regular top-level block
  const handleAddBlock = () => {
    setEditingBlock(undefined);
    setSelectedGroupId(null);
    setBlockDialogOpen(true);
    handleActionsClose();
  };
  
  // Handle creating a new group
  const handleCreateGroup = () => {
    const newGroup: BlockGroup = {
      id: generateStableId(),
      type: 'group',
      title: 'New Group',
      description: '',
      order: blocks.length,
      blocks: []
    };
    
    setEditingBlock(newGroup);
    setBlockDialogOpen(true);
    handleActionsClose();
  };
  
  // Handle editing a block
  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setBlockDialogOpen(true);
  };
  
  // Handle deleting a block
  const handleDeleteBlock = (blockId: string) => {
    // Simple implementation - avoid complex operations during delete
    const updatedBlocks = blocks.filter(block => {
      // For top-level blocks
      if (block.id === blockId) return false;
      
      // For nested blocks in groups
      if (block.type === 'group') {
        (block as BlockGroup).blocks = (block as BlockGroup).blocks.filter(
          childBlock => childBlock.id !== blockId
        );
      }
      
      return true;
    });
    
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
  };
  
  // Handle saving a block
  const handleSaveBlock = (block: Block) => {
    console.log("Saving block with details:", block);
    console.log("Selected group ID:", selectedGroupId);
    
    let updatedBlocks = cloneBlocks(blocks);
    
    // If editing an existing block
    if (block.id && blocks.some(b => b.id === block.id)) {
      console.log("Updating existing block:", block.id);
      updatedBlocks = updatedBlocks.map(existingBlock => {
        if (existingBlock.id === block.id) {
          return block;
        }
        // Check if this block exists in any group
        if (existingBlock.type === 'group') {
          const group = existingBlock as BlockGroup;
          if (group.blocks && group.blocks.some(b => b.id === block.id)) {
            return {
              ...group,
              blocks: group.blocks.map(b => b.id === block.id ? block : b)
            };
          }
        }
        return existingBlock;
      });
    } 
    // If saving a block to a group
    else if ((block as any).groupId || selectedGroupId) {
      // Get the target group ID - either from the block or from selectedGroupId
      const targetGroupId = (block as any).groupId || selectedGroupId;
      console.log("Adding block to group:", targetGroupId);
      
      // Remove the temporary groupId property
      const { groupId, ...cleanBlock } = block as any;
      // Add generated ID if not present
      const newBlock = { ...cleanBlock, id: cleanBlock.id || generateStableId() };
      
      console.log("New block to add to group:", newBlock);
      
      let foundGroup = false;
      updatedBlocks = updatedBlocks.map(existingBlock => {
        if (existingBlock.id === targetGroupId && existingBlock.type === 'group') {
          foundGroup = true;
          console.log("Found target group:", existingBlock.title);
          const group = existingBlock as BlockGroup;
          return {
            ...group,
            blocks: [...(group.blocks || []), newBlock]
          };
        }
        return existingBlock;
      });
      
      if (!foundGroup) {
        console.warn(`Group with ID ${targetGroupId} not found!`);
      }
    }
    // If adding a new top-level block
    else {
      // Ensure block has an ID
      const newBlock = { ...block, id: block.id || generateStableId() };
      console.log("Adding new top-level block:", newBlock);
      updatedBlocks.push(newBlock);
    }
    
    console.log("Content blocks changed:", updatedBlocks);
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
    setBlockDialogOpen(false);
    setEditingBlock(undefined);
    setSelectedGroupId(null);
  };
  
  // Handle reordering blocks
  const handleReorderBlocks = (reorderedBlocks: Block[]) => {
    setBlocks(reorderedBlocks);
    onBlocksChange(reorderedBlocks);
  };

  // Helper function to move a block to a group
  const moveBlockToGroup = (blockId: string, groupId: string) => {
    // Clone the blocks
    const updatedBlocks = cloneBlocks(blocks);
    
    // Find the block and group
    let blockToMove: Block | null = null;
    const filteredBlocks = updatedBlocks.filter(block => {
      if (block.id === blockId) {
        blockToMove = block;
        return false;
      }
      return true;
    });
    
    // If block not found at top level, check in groups
    if (!blockToMove) {
      for (const block of updatedBlocks) {
        if (block.type === 'group') {
          const group = block as BlockGroup;
          const index = group.blocks.findIndex(b => b.id === blockId);
          if (index !== -1) {
            blockToMove = group.blocks[index];
            group.blocks.splice(index, 1);
            break;
          }
        }
      }
    }
    
    // If block found, add it to the target group
    if (blockToMove) {
      const targetGroup = updatedBlocks.find(
        b => b.id === groupId && b.type === 'group'
      ) as BlockGroup | undefined;
      
      if (targetGroup) {
        targetGroup.blocks.push(blockToMove);
        setBlocks(updatedBlocks);
        onBlocksChange(updatedBlocks);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Kurssin sisältö</Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={isPreviewMode}
                onChange={(e) => setIsPreviewMode(e.target.checked)}
              />
            }
            label="Esikatselu"
          />
          <Tooltip title="Ota käyttöön sisäkkäinen näkymä, jotta voit raahata sisältöä ryhmien välillä">
            <FormControlLabel
              control={
                <Switch
                  checked={useNestedView}
                  onChange={(e) => setUseNestedView(e.target.checked)}
                />
              }
              label="Sisäkkäinen näkymä"
            />
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={(e) => handleActionsClick(e)}
            sx={{ ml: 2 }}
          >
            Lisää sisältöä
          </Button>
          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl)}
            onClose={handleActionsClose}
          >
            <MenuItem onClick={handleAddBlock}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Lisää lohko
            </MenuItem>
            {selectedGroupId && (
              <MenuItem onClick={() => handleAddBlockToGroup(selectedGroupId)}>
                <AddIcon fontSize="small" sx={{ mr: 1 }} />
                Lisää lohko ryhmään
              </MenuItem>
            )}
            <MenuItem onClick={handleCreateGroup}>
              <CreateGroupIcon fontSize="small" sx={{ mr: 1 }} />
              Luo uusi ryhmä
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleActionsClose}>
              <TreeViewIcon fontSize="small" sx={{ mr: 1 }} />
              Switch to Tree View (coming soon)
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {useNestedView ? (
        <NestedBlockList 
          blocks={blocks}
          onBlocksChange={handleReorderBlocks}
          onEdit={handleEditBlock}
          onDelete={handleDeleteBlock}
          onAddBlock={handleAddBlockToGroup}
          isPreviewMode={isPreviewMode}
          unlockedGroups={unlockedGroups}
          onToggleGroupLock={toggleGroupLock}
        />
      ) : (
        <BlockListNew 
          blocks={blocks}
          onReorder={handleReorderBlocks}
          onEdit={handleEditBlock}
          onDelete={handleDeleteBlock}
          onAddBlock={handleAddBlockToGroup}
          isPreviewMode={isPreviewMode}
          unlockedGroups={unlockedGroups}
          onToggleGroupLock={toggleGroupLock}
        />
      )}
      
      <BlockDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSave={handleSaveBlock}
        editingBlock={editingBlock}
        courseId={courseId}
      />
    </Box>
  );
};

export default CourseCanvas;
