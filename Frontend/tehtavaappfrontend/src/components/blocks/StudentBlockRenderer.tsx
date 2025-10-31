import React, { useState } from 'react';
import { Box, Typography, Paper, Collapse, IconButton, Alert } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Block } from '../../types/blocks';
import { 
  TextBlockContent, 
  MarkdownBlockContent, 
  ImageBlockContent, 
  MaterialBlockContent, 
  AssignmentBlockContent, 
  HtmlBlockContent 
} from './content';

interface StudentBlockRendererProps {
  block: Block;
  courseId: string;
  nestingLevel?: number; // Track nesting level for group blocks
}

export const StudentBlockRenderer: React.FC<StudentBlockRendererProps> = ({ 
  block, 
  courseId,
  nestingLevel = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // Limit maximum nesting level to prevent potential issues
  const MAX_NESTING_LEVEL = 3;
  const currentNestingLevel = Math.min(nestingLevel, MAX_NESTING_LEVEL);

  const renderBlockContent = () => {
    try {
      switch (block.type) {
        case 'text':
          return <TextBlockContent block={block as any} />;
        case 'markdown':
          return <MarkdownBlockContent block={block as any} />;
        case 'image':
          return <ImageBlockContent block={block as any} />;
        case 'material':
          return <MaterialBlockContent block={block as any} />;
        case 'assignment':
          return <AssignmentBlockContent block={block as any} courseId={courseId} />;
        case 'html':
          return <HtmlBlockContent block={block as any} />;
        case 'group':
          // Check if this group is explicitly marked as not visible to students
          const groupBlock = block as any;
          if (groupBlock.isVisible === false) {
            return (
              <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="body2" color="text.secondary">
                  This content is not available to students.
                </Typography>
              </Box>
            );
          }
          
          // Check if we've reached maximum nesting level
          if (currentNestingLevel >= MAX_NESTING_LEVEL) {
            console.warn(`Maximum nesting level (${MAX_NESTING_LEVEL}) reached for group block:`, groupBlock.id);
            return (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Group content is too deeply nested and cannot be displayed properly.
              </Alert>
            );
          }
          
          // Handle nested group blocks by rendering child blocks
          if (groupBlock.blocks && Array.isArray(groupBlock.blocks)) {
            // Log the group block structure for debugging
            console.log(`Rendering group block with ${groupBlock.blocks.length} children at nesting level ${currentNestingLevel}:`, 
              groupBlock.blocks.map((b: any) => ({ id: b.id, type: b.type })));
            
            return (
              <Box 
                sx={{ 
                  ml: { xs: 1, sm: 2 }, // Responsive margin
                  mt: 2,
                  // Add a subtle visual indicator for nesting
                  borderLeft: currentNestingLevel > 0 ? `2px solid rgba(0, 0, 0, 0.1)` : 'none',
                  pl: currentNestingLevel > 0 ? 2 : 0
                }}
              >
                {groupBlock.blocks
                  .filter((childBlock: any) => childBlock && childBlock.isVisible !== false)
                  .map((childBlock: any, index: number) => (
                    <Box key={childBlock.id || `child-block-${index}`} sx={{ mb: 2 }}>
                      <StudentBlockRenderer
                        block={childBlock}
                        courseId={courseId}
                        nestingLevel={currentNestingLevel + 1}
                      />
                    </Box>
                  ))
                }
              </Box>
            );
          }
          
          return null;
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

  return (
    <Paper
      elevation={1}
      sx={{ 
        overflow: 'hidden',
        borderRadius: 1,
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <Box 
        sx={{ 
          p: { xs: 1, sm: 2 }, // Responsive padding
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: 'primary.light',
          color: 'primary.contrastText'
        }}
      >
        <Typography 
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
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
        <Box sx={{ p: { xs: 1, sm: 2 } }}> {/* Responsive padding */}
          {renderBlockContent()}
        </Box>
      </Collapse>
    </Paper>
  );
}; 