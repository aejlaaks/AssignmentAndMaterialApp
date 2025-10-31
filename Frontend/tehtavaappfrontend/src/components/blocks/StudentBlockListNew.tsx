import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { Block } from '../../types/blocks';
import { isValidBlock, filterValidBlocks, logBlocksInfo } from '../../utils/blockUtils';
import { StudentBlockRendererNew } from './StudentBlockRendererNew';

interface StudentBlockListNewProps {
  blocks: any[];
  courseId: string;
}

/**
 * A component for displaying course content blocks to students in a read-only mode
 * Updated version that works with the new block rendering system
 */
export const StudentBlockListNew: React.FC<StudentBlockListNewProps> = ({ blocks, courseId }) => {
  const [validBlocks, setValidBlocks] = useState<Block[]>([]);
  const [invalidBlocks, setInvalidBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      
      // Log blocks info for debugging
      console.log('StudentBlockListNew - Course ID:', courseId);
      console.log('StudentBlockListNew - Raw blocks:', blocks);
      logBlocksInfo(blocks, 'Student Course Blocks');
      
      if (!Array.isArray(blocks)) {
        console.error('Blocks is not an array:', blocks);
        setError('Invalid content blocks format');
        setValidBlocks([]);
        setInvalidBlocks([]);
        return;
      }
      
      // Filter valid blocks and also remove blocks explicitly marked as not visible
      const valid = filterValidBlocks(blocks).filter(block => {
        // Only show blocks that don't have isVisible explicitly set to false
        // This applies to ALL block types
        const isVisible = block.isVisible !== false;
        if (!isVisible) {
          console.log(`Block ${block.id} (${block.title}) is hidden due to isVisible = false`);
        }
        return isVisible;
      });
      
      // Log assignment blocks specifically to help with debugging
      const assignmentBlocks = valid.filter(block => block.type === 'assignment');
      console.log(`Found ${assignmentBlocks.length} valid assignment blocks:`);
      assignmentBlocks.forEach(block => {
        console.log(`Assignment block: ${block.id}, Title: ${block.title}, AssignmentID: ${(block as any).assignmentId || 'missing'}`);
      });
      
      const invalid = blocks.filter(block => {
        const valid = isValidBlock(block);
        if (!valid) {
          console.log(`Block is invalid:`, block);
        }
        return !valid;
      });
      
      console.log('Valid blocks after filtering:', valid);
      console.log('Invalid blocks:', invalid);
      
      setValidBlocks(valid);
      setInvalidBlocks(invalid);
      
      if (valid.length === 0 && blocks.length > 0) {
        console.warn('No valid blocks found in:', blocks);
        setError('No valid content blocks found');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error processing blocks:', err);
      setError('Error processing content blocks');
    } finally {
      setIsLoading(false);
    }
  }, [blocks]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (validBlocks.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No content available for this course yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {invalidBlocks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some content blocks could not be displayed due to invalid format.
        </Alert>
      )}
      
      {validBlocks.map((block, index) => (
        <StudentBlockRendererNew 
          key={block.id} 
          block={block} 
          courseId={courseId} 
          showHeader={true}
          isFirst={index === 0}
        />
      ))}
    </Box>
  );
}; 