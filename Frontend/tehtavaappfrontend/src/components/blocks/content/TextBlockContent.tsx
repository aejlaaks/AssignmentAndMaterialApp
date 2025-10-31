import React from 'react';
import { Box, Typography } from '@mui/material';
import { TextBlock } from '../../../types/blocks';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import MarkdownRenderer from '../../common/MarkdownRenderer';

interface TextBlockContentProps {
  block: TextBlock;
  showTitle?: boolean;
}

export const TextBlockContent: React.FC<TextBlockContentProps> = ({ 
  block,
  showTitle = false
}) => {
  const hasImage = block.materialId || block.imageUrl;

  // Get the original content
  let originalContent = block.content;
  let processedContent = originalContent;

  // If showTitle is true, remove the first header from the content
  if (showTitle) {
    // This regex matches a header at the beginning of the content or after a newline
    // It captures the header level (number of #), the header content, and any following whitespace
    const headerRegex = /(^|\n)(#{1,6})\s+([^\n]+)(\n|$)/;
    const match = processedContent.match(headerRegex);
    
    if (match) {
      // Get the full match and its position
      const fullMatch = match[0];
      const startIndex = match.index;
      
      if (startIndex !== undefined) {
        // Remove the header completely
        processedContent = processedContent.substring(0, startIndex) + 
                          processedContent.substring(startIndex + fullMatch.length);
        
        // If we're at the beginning of the content, trim any leading whitespace
        if (startIndex === 0) {
          processedContent = processedContent.replace(/^\s+/, '');
        }
      }
    }
  }

  // Debug logging
  console.log('TextBlockContent - Original content:', originalContent);
  console.log('TextBlockContent - Final processed content:', processedContent);

  return (
    <Box sx={{ 
      p: 2, 
      border: '1px solid #e0e0e0', 
      borderRadius: 1,
      bgcolor: 'background.paper'
    }}>
      {/* Display image if material ID is available */}
      {block.materialId && (
        <Box sx={{ mb: 2 }}>
          <ImageWithFallback
            materialId={block.materialId}
            title={block.title || 'Block image'}
          />
        </Box>
      )}
      
      {/* Display image from URL if no material ID but imageUrl is available */}
      {!block.materialId && block.imageUrl && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <img
            src={block.imageUrl}
            alt={block.title || 'Block image'}
            style={{ 
              maxWidth: '100%', 
              display: 'block',
              margin: '0 auto',
              borderRadius: '4px'
            }}
          />
        </Box>
      )}

      {/* Render markdown content */}
      <MarkdownRenderer className="markdown-content">
        {processedContent}
      </MarkdownRenderer>
    </Box>
  );
}; 