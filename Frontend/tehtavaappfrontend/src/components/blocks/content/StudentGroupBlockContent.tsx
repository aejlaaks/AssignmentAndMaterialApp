import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { BlockGroup } from '../../../types/blocks';
import { StudentBlockRendererNew } from '../StudentBlockRendererNew';

interface StudentGroupBlockContentProps {
  block: BlockGroup;
  courseId: string;
  isVisible: boolean;
}

export const StudentGroupBlockContent: React.FC<StudentGroupBlockContentProps> = ({
  block,
  courseId,
  isVisible
}) => {
  // Render description if available
  const renderDescription = () => {
    if (block.description) {
      return (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {block.description}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Render the blocks within the group
  const renderGroupBlocks = () => {
    if (!block.blocks || block.blocks.length === 0) {
      return (
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
          <Typography variant="body2" color="text.secondary">
            This group has no content.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
        {block.blocks.map(childBlock => (
          <StudentBlockRendererNew
            key={childBlock.id}
            block={childBlock}
            courseId={courseId}
          />
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {renderDescription()}
      <Divider sx={{ my: 2 }} />
      {renderGroupBlocks()}
    </Box>
  );
}; 