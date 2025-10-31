import React from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Block } from '../../types/blocks';

interface BlockDebuggerProps {
  blocks: Block[];
  title?: string;
}

/**
 * A component for debugging content blocks
 * This is for development use only and should not be used in production
 */
export const BlockDebugger: React.FC<BlockDebuggerProps> = ({ 
  blocks, 
  title = 'Content Blocks Debugger'
}) => {
  if (!blocks || blocks.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', border: '1px dashed #ccc' }}>
        <Typography variant="h6" color="error">{title}</Typography>
        <Typography variant="body1" color="error">No content blocks found!</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', border: '1px dashed #ccc' }}>
      <Typography variant="h6" color="primary">{title}</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Found {blocks.length} content blocks
      </Typography>
      
      {blocks.map((block, index) => (
        <Accordion key={block.id} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`#${index + 1}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={block.type} 
                size="small" 
                color="secondary" 
              />
              <Typography variant="body1">{block.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ 
              p: 1, 
              bgcolor: '#f9f9f9', 
              borderRadius: 1,
              border: '1px solid #eee',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Block ID: {block.id}</Typography>
              
              {block.type === 'text' && (
                <Box>
                  <Typography variant="subtitle2">Content:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{block.content}</Typography>
                </Box>
              )}
              
              {block.type === 'markdown' && (
                <Box>
                  <Typography variant="subtitle2">Markdown Content:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{block.content}</Typography>
                </Box>
              )}
              
              {block.type === 'image' && (
                <Box>
                  <Typography variant="subtitle2">Image Block:</Typography>
                  <Typography variant="body2">Content: {block.content}</Typography>
                  {block.imageUrl && (
                    <Typography variant="body2">Image URL: {block.imageUrl}</Typography>
                  )}
                  {block.materialId && (
                    <Typography variant="body2">Material ID: {block.materialId}</Typography>
                  )}
                </Box>
              )}
              
              {block.type === 'material' && (
                <Box>
                  <Typography variant="subtitle2">Material Block:</Typography>
                  <Typography variant="body2">Content: {block.content}</Typography>
                  <Typography variant="body2">Material ID: {block.materialId}</Typography>
                </Box>
              )}
              
              {block.type === 'assignment' && (
                <Box>
                  <Typography variant="subtitle2">Assignment Block:</Typography>
                  <Typography variant="body2">Assignment ID: {block.assignmentId}</Typography>
                </Box>
              )}
              
              {block.type === 'html' && (
                <Box>
                  <Typography variant="subtitle2">HTML Content:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{block.content}</Typography>
                </Box>
              )}
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Raw Data:</Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 1, 
                  bgcolor: '#f0f0f0', 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '150px'
                }}
              >
                {JSON.stringify(block, null, 2)}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
}; 