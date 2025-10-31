import { useState, useCallback } from 'react';
import { Block, BlockGroup } from '../../../types/blocks';

/**
 * Custom hook for managing block groups
 */
export const useBlockGroups = (
  initialUnlockedGroups: string[] = []
) => {
  // Track which groups are unlocked (expanded)
  const [unlockedGroups, setUnlockedGroups] = useState<Set<string>>(
    new Set(initialUnlockedGroups)
  );

  // Track which blocks are collapsed
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  // Get all blocks in a group, including nested groups
  const getBlocksInGroup = useCallback((group: BlockGroup): Block[] => {
    if (!group.blocks || !Array.isArray(group.blocks)) {
      return [];
    }

    let allBlocks: Block[] = [];
    for (const block of group.blocks) {
      allBlocks.push(block);
      if (block.type === 'group') {
        allBlocks = [...allBlocks, ...getBlocksInGroup(block as BlockGroup)];
      }
    }
    return allBlocks;
  }, []);

  // Get all blocks from a list of blocks, including those in groups
  const getAllBlocks = useCallback((blocks: Block[]): Block[] => {
    let allBlocks: Block[] = [];
    for (const block of blocks) {
      allBlocks.push(block);
      if (block.type === 'group') {
        allBlocks = [...allBlocks, ...getBlocksInGroup(block as BlockGroup)];
      }
    }
    return allBlocks;
  }, [getBlocksInGroup]);

  // Toggle a group's locked/unlocked state
  const toggleGroupLock = useCallback((groupId: string) => {
    setUnlockedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Toggle a block's collapsed/expanded state
  const toggleBlockCollapse = useCallback((blockId: string) => {
    setCollapsedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  }, []);

  // Check if a block is collapsed
  const isBlockCollapsed = useCallback((blockId: string) => {
    return collapsedBlocks.has(blockId);
  }, [collapsedBlocks]);

  // Check if a group is unlocked
  const isGroupUnlocked = useCallback((groupId: string) => {
    return unlockedGroups.has(groupId);
  }, [unlockedGroups]);

  // Lock all groups
  const lockAllGroups = useCallback(() => {
    setUnlockedGroups(new Set());
  }, []);

  // Unlock all groups
  const unlockAllGroups = useCallback((groupIds: string[]) => {
    setUnlockedGroups(new Set(groupIds));
  }, []);

  return {
    unlockedGroups,
    collapsedBlocks,
    toggleGroupLock,
    toggleBlockCollapse,
    isBlockCollapsed,
    isGroupUnlocked,
    lockAllGroups,
    unlockAllGroups,
    getBlocksInGroup,
    getAllBlocks
  };
}; 