import { useState, useRef, useEffect } from 'react';
import { Block } from '../types/blocks';

interface UseBlocksProps {
  initialBlocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

interface UseBlocksReturn {
  blocks: Block[];
  expandedBlocks: Set<string>;
  addBlock: (block: Block) => void;
  updateBlock: (blockId: string, updatedBlock: Block) => void;
  deleteBlock: (blockId: string) => void;
  reorderBlocks: (sourceIndex: number, targetIndex: number) => void;
  toggleBlockExpansion: (blockId: string) => void;
}

export const useBlocks = ({ initialBlocks, onBlocksChange }: UseBlocksProps): UseBlocksReturn => {
  // Ensure initialBlocks is an array
  const safeInitialBlocks = Array.isArray(initialBlocks) ? initialBlocks : [];
  
  const [blocks, setBlocks] = useState<Block[]>(safeInitialBlocks);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const userInitiatedChange = useRef(false);
  const isInitialMount = useRef(true);

  // Initialize all blocks as expanded
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const newExpandedBlocks = new Set<string>();
      safeInitialBlocks.forEach(block => {
        newExpandedBlocks.add(block.id);
      });
      setExpandedBlocks(newExpandedBlocks);
      return;
    }

    // Ensure initialBlocks is an array when it changes
    const safeNewInitialBlocks = Array.isArray(initialBlocks) ? initialBlocks : [];
    
    if (!userInitiatedChange.current) {
      setBlocks(safeNewInitialBlocks);
      const newExpandedBlocks = new Set(expandedBlocks);
      safeNewInitialBlocks.forEach(block => {
        if (!newExpandedBlocks.has(block.id)) {
          newExpandedBlocks.add(block.id);
        }
      });
      setExpandedBlocks(newExpandedBlocks);
    }
  }, [initialBlocks]);

  const notifyParentOfChanges = (updatedBlocks: Block[]) => {
    userInitiatedChange.current = true;
    console.log('Notifying parent of block changes:', updatedBlocks);
    onBlocksChange(updatedBlocks);
  };

  const addBlock = (block: Block) => {
    const updatedBlocks = [...blocks, block];
    setBlocks(updatedBlocks);
    notifyParentOfChanges(updatedBlocks);
    
    // Automatically expand new block
    const newExpandedBlocks = new Set(expandedBlocks);
    newExpandedBlocks.add(block.id);
    setExpandedBlocks(newExpandedBlocks);
  };

  const updateBlock = (blockId: string, updatedBlock: Block) => {
    const updatedBlocks = blocks.map(block => 
      block.id === blockId ? updatedBlock : block
    );
    setBlocks(updatedBlocks);
    notifyParentOfChanges(updatedBlocks);
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);
    notifyParentOfChanges(updatedBlocks);
    
    // Remove from expanded list
    const newExpandedBlocks = new Set(expandedBlocks);
    newExpandedBlocks.delete(blockId);
    setExpandedBlocks(newExpandedBlocks);
  };

  const reorderBlocks = (sourceIndex: number, targetIndex: number) => {
    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(sourceIndex, 1);
    updatedBlocks.splice(targetIndex, 0, movedBlock);
    setBlocks(updatedBlocks);
    notifyParentOfChanges(updatedBlocks);
  };

  const toggleBlockExpansion = (blockId: string) => {
    const newExpandedBlocks = new Set(Array.from(expandedBlocks));
    if (newExpandedBlocks.has(blockId)) {
      newExpandedBlocks.delete(blockId);
    } else {
      newExpandedBlocks.add(blockId);
    }
    setExpandedBlocks(newExpandedBlocks);
  };

  return {
    blocks,
    expandedBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    toggleBlockExpansion,
  };
}; 