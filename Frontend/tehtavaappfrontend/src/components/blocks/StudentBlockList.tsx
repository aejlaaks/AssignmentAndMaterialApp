import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { Block } from '../../types/blocks';
import { isValidBlock, filterValidBlocks, logBlocksInfo } from '../../utils/blockUtils';
import { StudentBlockRenderer } from '.';

interface StudentBlockListProps {
  blocks: any[];
  courseId: string;
}

/**
 * A component for displaying course content blocks to students in a read-only mode
 */
export const StudentBlockList: React.FC<StudentBlockListProps> = ({ blocks, courseId }) => {
  const [validBlocks, setValidBlocks] = useState<Block[]>([]);
  const [invalidBlocks, setInvalidBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      
      // Log blocks info for debugging
      logBlocksInfo(blocks, 'Student Course Blocks');
      
      if (!Array.isArray(blocks)) {
        console.error('Blocks is not an array:', blocks);
        setError('Invalid content blocks format');
        setValidBlocks([]);
        setInvalidBlocks([]);
        return;
      }
      
      // Filter valid blocks
      const valid = filterValidBlocks(blocks).filter(block => {
        // Only show blocks that don't have isVisible explicitly set to false
        if (block.type === 'group') {
          return (block as any).isVisible !== false;
        }
        return true;
      });
      
      const invalid = blocks.filter(block => !isValidBlock(block));
      
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {invalidBlocks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some content blocks could not be displayed due to invalid format.
        </Alert>
      )}
      
      {validBlocks.map((block) => (
        <StudentBlockRenderer 
          key={block.id} 
          block={block} 
          courseId={courseId} 
        />
      ))}
    </Box>
  );
}; 