import { useState, useCallback, useRef } from 'react';
import { Block } from '../types/block';

interface UseCourseBlocksProps {
  initialBlocks: Block[];
}

export const useCourseBlocks = ({ initialBlocks }: UseCourseBlocksProps) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const handleBlockSelect = useCallback((blockId: string) => {
    setCurrentBlockId(blockId);
    
    // Scroll to the block with smooth animation
    const blockElement = blockRefs.current[blockId];
    if (blockElement) {
      blockElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  const handleBlockUncollapse = useCallback((blockId: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, isCollapsed: false }
          : block
      )
    );
  }, []);

  const registerBlockRef = useCallback((blockId: string, element: HTMLElement | null) => {
    blockRefs.current[blockId] = element;
  }, []);

  return {
    blocks,
    currentBlockId,
    handleBlockSelect,
    handleBlockUncollapse,
    registerBlockRef,
  };
}; 