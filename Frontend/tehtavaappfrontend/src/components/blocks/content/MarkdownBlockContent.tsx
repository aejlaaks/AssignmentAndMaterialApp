import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { MarkdownBlock } from '../../../types/blocks';
import { MarkdownRenderer } from '../../markdown';

interface MarkdownBlockContentProps {
  block: MarkdownBlock;
  showTitle?: boolean;
}

export const MarkdownBlockContent: React.FC<MarkdownBlockContentProps> = ({ 
  block,
  showTitle = false
}) => {
  // Get the original content
  const originalContent = block.content;
  
  // Use useMemo to prevent unnecessary reprocessing
  const processedContent = useMemo(() => {
    let content = originalContent;
    
    // If showTitle is true, remove the first header from the content
    if (showTitle) {
      // This regex matches a header at the beginning of the content or after a newline
      const headerRegex = /(^|\n)(#{1,6})\s+([^\n]+)(\n|$)/;
      const match = content.match(headerRegex);
      
      if (match) {
        // Get the full match and its position
        const fullMatch = match[0];
        const startIndex = match.index;
        
        if (startIndex !== undefined) {
          // Remove the header completely
          content = content.substring(0, startIndex) + 
                    content.substring(startIndex + fullMatch.length);
          
          // If we're at the beginning of the content, trim any leading whitespace
          if (startIndex === 0) {
            content = content.replace(/^\s+/, '');
          }
        }
      }
    }
    
    return content;
  }, [originalContent, showTitle]);

  return (
    <Box sx={{ 
      p: 2, 
      border: '1px solid #e0e0e0', 
      borderRadius: 1,
      bgcolor: 'background.paper',
      overflowX: 'auto',  // Add horizontal scrolling for tables and code blocks
      '& pre': {          // Ensure code blocks don't overflow
        whiteSpace: 'pre-wrap',
        overflowX: 'auto'
      },
      '& .graphviz-container': {  // Specific styling for graphviz output
        maxWidth: '100%',
        margin: '1rem auto',
        textAlign: 'center'
      },
      '& svg': {                  // SVG styling for graphviz diagrams
        maxWidth: '100%',
        height: 'auto',
        margin: '0 auto'
      },
      '& .mermaid': {             // Mermaid styling
        textAlign: 'center',
        margin: '1rem auto'
      }
    }}>
      <MarkdownRenderer className="markdown-content">
        {processedContent}
      </MarkdownRenderer>
    </Box>
  );
}; 