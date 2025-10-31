import { Block, BlockType } from '../../../types/blocks';

/**
 * Base interface for all block editors
 */
export interface BlockEditorProps<T extends Block = Block> {
  /** Current block data (if editing an existing block) */
  block?: T;
  /** Course ID (required for certain block types) */
  courseId?: string;
  /** Flag to indicate if the form is in a valid state */
  onValidityChange?: (isValid: boolean) => void;
  /** Handler for when block data changes */
  onChange?: (blockData: Partial<T>) => void;
}

/**
 * Shared interface for common block editor state
 */
export interface BlockEditorState {
  isValid: boolean;
  isDirty: boolean;
} 