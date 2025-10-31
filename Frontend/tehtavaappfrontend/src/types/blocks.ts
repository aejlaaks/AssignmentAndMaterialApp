import { ReactNode } from 'react';

// Lohkotyyppien määrittely
export type BlockType = 'text' | 'markdown' | 'image' | 'material' | 'assignment' | 'html' | 'group' | 'test';

// Base interface for all block types
export interface Block {
  id: string;
  type: BlockType;
  title: string;
  order: number;
  content?: string;        // Allow content on base Block for compatibility
  materialId?: string;     // Allow materialId on base Block for compatibility
  imageUrl?: string;       // Allow imageUrl on base Block for compatibility
  assignmentId?: string;   // Allow assignmentId on base Block for compatibility
  description?: string;    // Allow description on base Block for compatibility
  isVisible?: boolean;     // Controls whether block is visible to students
  groupId?: string;        // ID of the parent group, if this block belongs to a group
}

// Tekstilohkon rajapinta
export interface TextBlock extends Block {
  type: 'text';
  content: string;
  imageUrl?: string;
  materialId?: string;
}

// Markdown-lohkon rajapinta
export interface MarkdownBlock extends Block {
  type: 'markdown';
  content: string;
}

// Kuvalohkon rajapinta
export interface ImageBlock extends Block {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  imageUrl?: string;       // For backward compatibility
  materialId?: string;     // For backward compatibility
}

// Materiaalilohkon rajapinta
export interface MaterialBlock extends Block {
  type: 'material';
  materialId: string;
  materialName?: string;
  materialDescription?: string;
  materialType?: string;
  materialUrl?: string;
  content?: string;        // For backward compatibility
}

// Tehtävälohkon rajapinta
export interface AssignmentBlock extends Block {
  type: 'assignment';
  assignmentId: string;
  assignmentName?: string;
  assignmentDescription?: string;
  dueDate?: string;
}

// HTML-lohkon rajapinta
export interface HtmlBlock extends Block {
  type: 'html';
  content: string;
}

// Lohkoryhmän rajapinta
export interface BlockGroup extends Block {
  type: 'group';
  description: string;
  blocks: Block[];
  // Note: isVisible is now inherited from Block interface
}

// Test block interface
export interface TestBlock extends Block {
  type: 'test';
  testId: string;
  proctored: boolean;
  showResults: 'immediately' | 'after_due_date' | 'manual';
  timeLimit: number;  // in minutes
  passingScore: number;
  attempts: number;   // max number of attempts allowed
  dueDate?: string;
  allowedResources?: string[];  // List of permitted resources/materials
}

// Union type for all block types
export type BlockTypes = 
  | TextBlock 
  | MarkdownBlock 
  | ImageBlock 
  | MaterialBlock 
  | AssignmentBlock 
  | HtmlBlock
  | BlockGroup
  | TestBlock;

// BlockRenderer props - updated for new implementation
export interface BlockRendererProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
  isDraggable?: boolean;
}

// Lohkolistan propsit
export interface BlockListProps {
  blocks: Block[];
  onReorder: (blocks: Block[]) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
  isPreviewMode?: boolean;
  isNested?: boolean;
  groupId?: string;
}

// Lohkodialogin propsit
export interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (block: Block) => void;
  editingBlock?: Block;
  courseId: string;
} 