import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockGroup } from '../../../types/blocks';

/**
 * Custom hook for managing blocks
 */
export const useBlocks = (
  initialBlocks: Block[] = [], 
  onSave?: (blocks: Block[]) => void
) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add a new block
  const addBlock = useCallback((block: Block) => {
    const newBlock = {
      ...block,
      id: block.id || uuidv4(),
      order: blocks.length // Add at the end
    };
    
    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    
    if (onSave) {
      onSave(updatedBlocks);
    }
    
    return newBlock;
  }, [blocks, onSave]);

  // Update an existing block
  const updateBlock = useCallback((updatedBlock: Block) => {
    const updatedBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    
    setBlocks(updatedBlocks);
    
    if (onSave) {
      onSave(updatedBlocks);
    }
    
    return updatedBlock;
  }, [blocks, onSave]);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);
    
    if (onSave) {
      onSave(updatedBlocks);
    }
  }, [blocks, onSave]);

  // Reorder blocks
  const reorderBlocks = useCallback((reorderedBlocks: Block[]) => {
    // Update the order property of each block
    const updatedBlocks = reorderedBlocks.map((block, index) => ({
      ...block,
      order: index
    }));
    
    setBlocks(updatedBlocks);
    
    if (onSave) {
      onSave(updatedBlocks);
    }
  }, [onSave]);

  // Add a block to a group
  const addBlockToGroup = useCallback((block: Block, groupId: string) => {
    const updatedBlocks = [...blocks];
    const groupIndex = updatedBlocks.findIndex(b => b.id === groupId);
    
    if (groupIndex === -1 || updatedBlocks[groupIndex].type !== 'group') {
      console.error('Group not found or not a group block');
      return;
    }
    
    const groupBlock = updatedBlocks[groupIndex] as BlockGroup;
    const newBlock = {
      ...block,
      id: block.id || uuidv4(),
      groupId: groupId,
      order: groupBlock.blocks.length // Add at the end of the group
    };
    
    // Add the block to the group
    groupBlock.blocks.push(newBlock);
    
    setBlocks(updatedBlocks);
    
    if (onSave) {
      onSave(updatedBlocks);
    }
    
    return newBlock;
  }, [blocks, onSave]);

  // Open dialog to create a new block
  const openCreateDialog = useCallback(() => {
    setSelectedBlock(null);
    setIsDialogOpen(true);
  }, []);

  // Open dialog to edit an existing block
  const openEditDialog = useCallback((block: Block) => {
    setSelectedBlock(block);
    setIsDialogOpen(true);
  }, []);

  // Close the dialog
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedBlock(null);
  }, []);

  // Save a block from the dialog
  const saveBlock = useCallback((block: Block) => {
    if (selectedBlock) {
      // Update existing block
      updateBlock(block);
    } else {
      // Add new block
      addBlock(block);
    }
    
    closeDialog();
  }, [selectedBlock, addBlock, updateBlock, closeDialog]);

  return {
    blocks,
    selectedBlock,
    isDialogOpen,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    addBlockToGroup,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveBlock
  };
}; 