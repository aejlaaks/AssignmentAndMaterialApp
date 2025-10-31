import { 
  Block, 
  BlockType, 
  BlockTypes, 
  TextBlock, 
  MarkdownBlock, 
  ImageBlock, 
  MaterialBlock, 
  AssignmentBlock, 
  HtmlBlock, 
  BlockGroup, 
  TestBlock 
} from '../../../types/blocks';

/**
 * Utility functions for working with blocks
 */

/**
 * Type guard to check if a block is of a specific type
 * @param block The block to check
 * @param type The type to check against
 * @returns True if the block is of the specified type
 */
export function isBlockOfType<T extends BlockType>(block: Block, type: T): block is BlockTypes & { type: T } {
  return block.type === type;
}

/**
 * Get the display name for a block type
 * @param type Block type
 * @returns Human-readable display name for the block type
 */
export function getBlockTypeDisplayName(type: BlockType): string {
  switch (type) {
    case 'text':
      return 'Text';
    case 'markdown':
      return 'Markdown';
    case 'image':
      return 'Image';
    case 'material':
      return 'Material';
    case 'assignment':
      return 'Assignment';
    case 'html':
      return 'HTML';
    case 'group':
      return 'Block Group';
    case 'test':
      return 'Test';
    default:
      return 'Unknown';
  }
}

/**
 * Get the CSS color for a block type
 * @param type Block type
 * @returns CSS color string for the block type
 */
export function getBlockTypeColor(type: BlockType): string {
  switch (type) {
    case 'text':
      return '#2196f3'; // Blue
    case 'markdown':
      return '#ff9800'; // Orange
    case 'image':
      return '#4caf50'; // Green
    case 'material':
      return '#9c27b0'; // Purple
    case 'assignment':
      return '#f44336'; // Red
    case 'html':
      return '#607d8b'; // Blue Grey
    case 'group':
      return '#ff9800'; // Orange
    case 'test':
      return '#9c27b0'; // Purple
    default:
      return '#e0e0e0'; // Grey
  }
}

/**
 * Creates an empty text block with default values
 */
export function createEmptyTextBlock(): Partial<TextBlock> {
  return {
    type: 'text',
    title: '',
    isVisible: true,
    content: '',
  };
}

/**
 * Creates an empty markdown block with default values
 */
export function createEmptyMarkdownBlock(): Partial<MarkdownBlock> {
  return {
    type: 'markdown',
    title: '',
    isVisible: true,
    content: '',
  };
}

/**
 * Creates an empty image block with default values
 */
export function createEmptyImageBlock(): Partial<ImageBlock> {
  return {
    type: 'image',
    title: '',
    isVisible: true,
    url: '',
  };
}

/**
 * Creates an empty material block with default values
 */
export function createEmptyMaterialBlock(): Partial<MaterialBlock> {
  return {
    type: 'material',
    title: '',
    isVisible: true,
    materialId: '',
  };
}

/**
 * Creates an empty assignment block with default values
 */
export function createEmptyAssignmentBlock(): Partial<AssignmentBlock> {
  return {
    type: 'assignment',
    title: '',
    isVisible: true,
    assignmentId: '',
  };
}

/**
 * Creates an empty HTML block with default values
 */
export function createEmptyHtmlBlock(): Partial<HtmlBlock> {
  return {
    type: 'html',
    title: '',
    isVisible: true,
    content: '',
  };
}

/**
 * Creates an empty group block with default values
 */
export function createEmptyGroupBlock(): Partial<BlockGroup> {
  return {
    type: 'group',
    title: '',
    isVisible: true,
    description: '',
    blocks: [],
  };
}

/**
 * Creates an empty test block with default values
 */
export function createEmptyTestBlock(): Partial<TestBlock> {
  return {
    type: 'test',
    title: '',
    isVisible: true,
    testId: '',
    proctored: false,
    showResults: 'immediately',
    timeLimit: 60,
    passingScore: 60,
    attempts: 1,
    allowedResources: [],
  };
}

/**
 * Creates an empty block of the specified type with default values
 * @param type Block type to create
 * @returns A new block with default values
 */
export function createEmptyBlock(type: BlockType): Partial<BlockTypes> {
  switch (type) {
    case 'text':
      return createEmptyTextBlock();
    case 'markdown':
      return createEmptyMarkdownBlock();
    case 'image':
      return createEmptyImageBlock();
    case 'material':
      return createEmptyMaterialBlock();
    case 'assignment':
      return createEmptyAssignmentBlock();
    case 'html':
      return createEmptyHtmlBlock();
    case 'group':
      return createEmptyGroupBlock();
    case 'test':
      return createEmptyTestBlock();
    default:
      return {
        type,
        title: '',
        isVisible: true,
      };
  }
} 