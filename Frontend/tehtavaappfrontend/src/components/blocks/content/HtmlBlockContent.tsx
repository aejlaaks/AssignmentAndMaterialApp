import React from 'react';
import { Box, Typography } from '@mui/material';
import { HtmlBlock } from '../../../types/blocks';
import DOMPurify from 'dompurify';

interface HtmlBlockContentProps {
  block: HtmlBlock;
  showTitle?: boolean;
}

export const HtmlBlockContent: React.FC<HtmlBlockContentProps> = ({ 
  block,
  showTitle = false
}) => {
  // Puhdistetaan HTML turvalliseksi
  const sanitizedHtml = DOMPurify.sanitize(block.content, {
    ADD_TAGS: ['iframe'], // Sallitaan iframe-tagit esim. YouTube-videoille
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'], // Sallitaan iframe-attribuutit
  });

  // Tyylimäärittelyt HTML-sisällölle
  const htmlStyles = `
    .html-content {
      font-family: inherit;
      line-height: 1.6;
    }
    .html-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1rem auto;
    }
    .html-content iframe {
      max-width: 100%;
      margin: 1rem auto;
      display: block;
    }
    .html-content h1, 
    .html-content h2, 
    .html-content h3, 
    .html-content h4, 
    .html-content h5, 
    .html-content h6 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 500;
      line-height: 1.2;
    }
    .html-content p {
      margin-bottom: 1rem;
    }
    .html-content a {
      color: #1976d2;
      text-decoration: none;
    }
    .html-content a:hover {
      text-decoration: underline;
    }
    .html-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    .html-content th,
    .html-content td {
      border: 1px solid #e0e0e0;
      padding: 0.5rem;
    }
    .html-content th {
      background-color: #f5f5f5;
      font-weight: 500;
    }
    .html-content pre,
    .html-content code {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 0.2rem 0.4rem;
      font-family: monospace;
    }
    .html-content pre {
      padding: 1rem;
      overflow-x: auto;
    }
    .html-content pre code {
      padding: 0;
      background-color: transparent;
    }
    .html-content blockquote {
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      border-left: 4px solid #e0e0e0;
      color: #666;
    }
    .html-content ul,
    .html-content ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }
  `;

  return (
    <Box sx={{ 
      p: 2, 
      border: '1px solid #e0e0e0', 
      borderRadius: 1,
      bgcolor: 'background.paper'
    }}>
      {/* Remove title display since it's already shown in the header */}
      {/* {showTitle && block.title && (
        <Typography variant="h6" gutterBottom>
          {block.title}
        </Typography>
      )} */}

      <style>{htmlStyles}</style>
      
      <Box 
        className="html-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        sx={{
          '& > *:first-of-type': { mt: 0 },
          '& > *:last-of-type': { mb: 0 }
        }}
      />
    </Box>
  );
}; 