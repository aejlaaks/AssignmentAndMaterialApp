import { Block, BlockType, BlockGroup } from '../types/blocks';

/**
 * Sorts blocks by their position in the array (assuming the order is important)
 * @param blocks Array of blocks to sort
 * @returns Sorted array of blocks
 */
export const sortBlocks = (blocks: Block[]): Block[] => {
  return [...blocks]; // Return a copy of the array to avoid mutating the original
};

/**
 * Filters blocks by type
 * @param blocks Array of blocks to filter
 * @param type Block type to filter by
 * @returns Filtered array of blocks
 */
export const filterBlocksByType = (blocks: Block[], type: Block['type']): Block[] => {
  return blocks.filter(block => block.type === type);
};

/**
 * Checks if a value is a valid Block object
 * @param block The value to check
 * @returns True if the value is a valid Block object
 */
export const isValidBlock = (block: any): block is Block => {
  if (!block || typeof block !== 'object') {
    console.warn('Block is not an object:', block);
    return false;
  }

  // Check required properties
  if (!block.id || typeof block.id !== 'string') {
    console.warn('Block is missing valid id:', block);
    return false;
  }

  if (!block.type || typeof block.type !== 'string') {
    console.warn('Block is missing valid type:', block);
    return false;
  }

  if (!block.title || typeof block.title !== 'string') {
    console.warn('Block is missing valid title:', block);
    return false;
  }

  // Check if type is valid
  const validTypes: BlockType[] = ['text', 'markdown', 'image', 'material', 'assignment', 'html', 'group'];
  if (!validTypes.includes(block.type as BlockType)) {
    console.warn(`Block has invalid type: ${block.type}`, block);
    return false;
  }

  // Type-specific validation
  switch (block.type) {
    case 'text':
    case 'markdown':
    case 'html':
      if (typeof block.content !== 'string') {
        console.warn(`${block.type} block is missing valid content:`, block);
        return false;
      }
      break;
    case 'image':
      // Image block should have either imageUrl or materialId
      if (!block.imageUrl && !block.materialId) {
        console.warn('Image block is missing both imageUrl and materialId:', block);
        return false;
      }
      break;
    case 'material':
      if (!block.materialId || typeof block.materialId !== 'string') {
        console.warn('Material block is missing valid materialId:', block);
        return false;
      }
      // Content is optional for material blocks according to the MaterialBlock interface
      break;
    case 'assignment':
      if (!block.assignmentId || typeof block.assignmentId !== 'string') {
        // Special enhanced debugging for assignment blocks
        console.warn('Assignment block validation failed - missing assignmentId:', block);
        console.warn('Assignment block fields:', Object.keys(block));
        
        // If we have title and description, it might be salvageable
        if (block.assignmentName && block.description) {
          console.log('Assignment block has title and description - might be salvageable in the renderer');
          return true; // Allow it to pass validation for special handling in the renderer
        }
        
        // If we have assignmentName, it's also salvageable (even without description)
        if (block.assignmentName) {
          console.log('Assignment block has assignmentName - allowing it to pass validation for renderer recovery');
          return true;
        }
        
        // If we only have a title, it might still be recoverable by matching to course assignments
        if (block.title) {
          console.log('Assignment block only has title - will try to match to a course assignment in the renderer');
          return true;
        }
        
        return false;
      }
      break;
    case 'group':
      if (!Array.isArray(block.blocks)) {
        console.warn('Group block is missing valid blocks array:', block);
        return false;
      }
      break;
  }

  return true;
};

/**
 * Filters an array of blocks to only include valid blocks
 * @param blocks Array of blocks to filter
 * @returns Array of valid blocks
 */
export const filterValidBlocks = (blocks: any[]): Block[] => {
  console.log('[BLOCK UTILS] Starting filterValidBlocks...');
  
  if (!blocks) {
    console.warn('[BLOCK UTILS] filterValidBlocks called with null or undefined input');
    return [];
  }
  
  if (!Array.isArray(blocks)) {
    console.warn('[BLOCK UTILS] filterValidBlocks called with non-array:', blocks);
    console.warn('[BLOCK UTILS] Input type:', typeof blocks);
    
    // Try to handle special cases
    if (blocks && typeof blocks === 'object' && '$values' in blocks) {
      console.log('[BLOCK UTILS] Object with $values detected, trying to extract array');
      const valuesArray = (blocks as any).$values;
      if (Array.isArray(valuesArray)) {
        console.log(`[BLOCK UTILS] Successfully extracted array from $values with ${valuesArray.length} items`);
        blocks = valuesArray;
      } else {
        console.warn('[BLOCK UTILS] $values is not an array, returning empty array');
        return [];
      }
    } else {
      return [];
    }
  }
  
  console.log(`[BLOCK UTILS] Processing ${blocks.length} blocks`);
  
  // Log some information about the blocks we received
  const blockTypes = blocks.map(b => b?.type || 'undefined').reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('[BLOCK UTILS] Block types in input:', blockTypes);
  
  // Detailed validation
  const validBlocks: Block[] = [];
  const invalidBlocks: any[] = [];
  
  blocks.forEach((block, index) => {
    if (isValidBlock(block)) {
      validBlocks.push(block);
    } else {
      console.warn(`[BLOCK UTILS] Invalid block at index ${index}:`, block);
      invalidBlocks.push(block);
    }
  });
  
  console.log(`[BLOCK UTILS] Validation complete - Valid: ${validBlocks.length}, Invalid: ${invalidBlocks.length}`);
  
  if (invalidBlocks.length > 0) {
    console.warn('[BLOCK UTILS] Common issues with invalid blocks:');
    const missingId = invalidBlocks.filter(b => !b?.id).length;
    const missingType = invalidBlocks.filter(b => !b?.type).length;
    const missingTitle = invalidBlocks.filter(b => !b?.title).length;
    
    console.warn(`- Missing ID: ${missingId} blocks`);
    console.warn(`- Missing type: ${missingType} blocks`);
    console.warn(`- Missing title: ${missingTitle} blocks`);
  }
  
  // Process group blocks (recursively validate their children)
  const processedBlocks = validBlocks.map(block => {
    if (block.type === 'group' && Array.isArray((block as BlockGroup).blocks)) {
      console.log(`[BLOCK UTILS] Processing group block ${block.id} with ${(block as BlockGroup).blocks.length} children`);
      return {
        ...block,
        blocks: filterValidBlocks((block as BlockGroup).blocks)
      };
    }
    return block;
  });
  
  console.log(`[BLOCK UTILS] filterValidBlocks complete - Returning ${processedBlocks.length} blocks`);
  return processedBlocks;
};

/**
 * Logs information about blocks for debugging
 * @param blocks Array of blocks to log
 * @param label Optional label for the log
 */
export const logBlocksInfo = (blocks: any[], label = 'Blocks'): void => {
  if (!Array.isArray(blocks)) {
    console.warn(`${label} is not an array:`, blocks);
    return;
  }
  
  const validBlocks = blocks.filter(isValidBlock);
  const invalidBlocks = blocks.filter(block => !isValidBlock(block));
  
  // Count group blocks and nested blocks
  const groupBlocks = validBlocks.filter(block => block.type === 'group');
  const totalNestedBlocks = groupBlocks.reduce((total, group) => {
    return total + ((group as BlockGroup).blocks?.length || 0);
  }, 0);
  
  console.group(`${label} Info`);
  console.log('Total blocks:', blocks.length);
  console.log('Valid blocks:', validBlocks.length);
  console.log('Invalid blocks:', invalidBlocks.length);
  console.log('Group blocks:', groupBlocks.length);
  console.log('Nested blocks in groups:', totalNestedBlocks);
  
  if (groupBlocks.length > 0) {
    console.group('Group Blocks');
    groupBlocks.forEach((block, index) => {
      const group = block as BlockGroup;
      console.log(`Group #${index + 1}:`, {
        id: group.id,
        title: group.title,
        isVisible: group.isVisible,
        childBlockCount: group.blocks?.length || 0
      });
    });
    console.groupEnd();
  }
  
  if (invalidBlocks.length > 0) {
    console.group('Invalid Blocks');
    invalidBlocks.forEach((block, index) => {
      console.log(`Invalid block #${index + 1}:`, block);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}; 