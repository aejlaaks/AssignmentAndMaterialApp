import React, { useState, useEffect } from 'react';
import { Block, BlockType, TextBlock, MarkdownBlock, ImageBlock, MaterialBlock, AssignmentBlock, HtmlBlock, BlockGroup, TestBlock } from '../../../types/blocks';
import { 
  TextBlockEditor,
  MarkdownBlockEditor, 
  ImageBlockEditor,
  MaterialBlockEditor,
  AssignmentBlockEditor,
  HtmlBlockEditor,
  GroupBlockEditor,
  TestBlockEditor
} from './';
import { BlockEditorProps } from './BlockEditorProps';

interface UnifiedBlockEditorProps {
  blockType: BlockType;
  block?: Block;
  courseId?: string;
  onValidityChange?: (isValid: boolean) => void;
  onChange?: (blockData: Partial<Block>) => void;
}

/**
 * A unified block editor component that renders the appropriate editor
 * based on block type.
 */
export const BlockEditor: React.FC<UnifiedBlockEditorProps> = ({
  blockType,
  block,
  courseId,
  onValidityChange,
  onChange
}) => {
  const [isValid, setIsValid] = useState(true);

  // Handle validity change from child editors
  const handleValidityChange = (valid: boolean) => {
    setIsValid(valid);
    if (onValidityChange) {
      onValidityChange(valid);
    }
  };

  // Pass validity to parent on mount
  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(isValid);
    }
  }, []);

  // Render appropriate editor based on block type
  switch (blockType) {
    case 'text':
      return (
        <TextBlockEditor
          block={block as TextBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'markdown':
      return (
        <MarkdownBlockEditor
          block={block as MarkdownBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'image':
      return (
        <ImageBlockEditor
          block={block as ImageBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'material':
      return (
        <MaterialBlockEditor
          block={block as MaterialBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'assignment':
      return (
        <AssignmentBlockEditor
          block={block as AssignmentBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'html':
      return (
        <HtmlBlockEditor
          block={block as HtmlBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'group':
      return (
        <GroupBlockEditor
          block={block as BlockGroup | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    case 'test':
      return (
        <TestBlockEditor
          block={block as TestBlock | undefined}
          courseId={courseId}
          onValidityChange={handleValidityChange}
          onChange={onChange}
        />
      );
    
    default:
      console.error(`Unsupported block type: ${blockType}`);
      return <div>Unsupported block type: {blockType}</div>;
  }
}; 