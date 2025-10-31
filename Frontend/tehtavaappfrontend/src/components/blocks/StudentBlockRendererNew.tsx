import React, { useState, useRef } from 'react';
import { Box, Typography, Paper, Collapse, IconButton, Alert, Stack } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { 
  Block, 
  BlockGroup, 
  TextBlock,
  MarkdownBlock,
  ImageBlock,
  MaterialBlock,
  AssignmentBlock,
  HtmlBlock 
} from '../../types/blocks';
import { 
  TextBlockContent, 
  MarkdownBlockContent, 
  ImageBlockContent, 
  MaterialBlockContent, 
  AssignmentBlockContent, 
  HtmlBlockContent 
} from './content';

interface StudentBlockRendererNewProps {
  block: Block;
  courseId: string;
  showHeader?: boolean;
  isFirst?: boolean;
}

// Component to render a group of blocks
const RenderGroupContent = ({ block, courseId }: { block: BlockGroup, courseId: string }) => {
  if (!block.blocks || block.blocks.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No content available in this section.
      </Alert>
    );
  }

  // Render child blocks inside a box
  return (
    <Stack spacing={2}>
      {block.blocks.map((childBlock, index) => (
        <StudentBlockRendererNew 
          key={childBlock.id || `child-block-${index}`}
          block={childBlock}
          courseId={courseId}
          showHeader={index !== 0} // Only show header for non-first blocks
          isFirst={index === 0}
        />
      ))}
    </Stack>
  );
};

export const StudentBlockRendererNew: React.FC<StudentBlockRendererNewProps> = ({ 
  block, 
  courseId,
  showHeader = true,
  isFirst = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(isFirst);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const renderBlockContent = () => {
    try {
      console.log(`Rendering block: ${block.id} (${block.type}) - ${block.title}`);
      
      if (block.isVisible === false) {
        console.log(`Block ${block.id} is marked as not visible`);
        return (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" color="text.secondary">
              This content is not available to students.
            </Typography>
          </Box>
        );
      }
      
      switch (block.type) {
        case 'text':
          console.log(`Rendering text block: ${block.id}`);
          return <TextBlockContent block={block as TextBlock} showTitle={false} />;
        case 'markdown':
          console.log(`Rendering markdown block: ${block.id}`);
          return <MarkdownBlockContent block={block as MarkdownBlock} showTitle={false} />;
        case 'image':
          console.log(`Rendering image block: ${block.id}`);
          return <ImageBlockContent block={block as ImageBlock} showTitle={false} />;
        case 'material':
          console.log(`Rendering material block: ${block.id}`);
          return <MaterialBlockContent block={block as MaterialBlock} showTitle={false} />;
        case 'assignment':
          console.log(`Rendering assignment block: ${block.id}`);
          console.log(`Assignment ID: ${(block as AssignmentBlock).assignmentId || 'missing'}, Title: ${block.title}`);
          
          // Check if it has metadata that might help with debugging
          if ((block as AssignmentBlock).assignmentName) {
            console.log(`Assignment Name from metadata: ${(block as AssignmentBlock).assignmentName}`);
          }
          
          return <AssignmentBlockContent block={block as AssignmentBlock} courseId={courseId} showTitle={false} />;
        case 'html':
          console.log(`Rendering html block: ${block.id}`);
          return <HtmlBlockContent block={block as HtmlBlock} showTitle={false} />;
        case 'group':
          console.log(`Rendering group block: ${block.id}`);
          const groupBlock = block as BlockGroup;
          if (groupBlock.isVisible === false) {
            return (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="body2" color="text.secondary">
                  This content is not available to students.
                </Typography>
              </Box>
            );
          }
          
          return (
            <Box sx={{ p: 1 }}>
              {block.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {block.description}
                  </Typography>
                </Box>
              )}
              <RenderGroupContent 
                block={groupBlock}
                courseId={courseId}
              />
            </Box>
          );
        default:
          console.warn(`Unknown block type: ${(block as any).type}`);
          return (
            <Typography color="error">
              Unknown content type: {(block as any).type}
            </Typography>
          );
      }
    } catch (error) {
      console.error(`Error rendering block ${block.id} of type ${block.type}:`, error);
      return (
        <Alert severity="error">
          Failed to display content. Please contact your course instructor.
        </Alert>
      );
    }
  };

  if (block.type === 'group' && showHeader) {
    return (
      <Paper
        elevation={2}
        sx={{ 
          overflow: 'hidden',
          borderRadius: 1,
          mb: 2,
          bgcolor: '#f8f9fa',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: 2
          },
          width: '100%'
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 1,
            mb: 2
          }}
        >
          <Typography variant="h6">
            {block.title}
          </Typography>
          
          <IconButton 
            size="small" 
            onClick={toggleExpansion}
            sx={{ color: 'inherit' }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2 }}>
            {renderBlockContent()}
          </Box>
        </Collapse>
      </Paper>
    );
  }

  if (block.type === 'group' && !showHeader) {
    return renderBlockContent();
  }

  return (
    <Paper
      elevation={1}
      sx={{ 
        overflow: 'hidden',
        borderRadius: 1,
        mb: 2,
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 2
        },
        width: '100%'
      }}
      ref={containerRef}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'primary.light',
          color: 'primary.contrastText'
        }}
      >
        <Typography variant="h6">
          {block.title}
        </Typography>
        
        <IconButton 
          size="small" 
          onClick={toggleExpansion}
          sx={{ color: 'inherit' }}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          {renderBlockContent()}
        </Box>
      </Collapse>
    </Paper>
  );
}; 