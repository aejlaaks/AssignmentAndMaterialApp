import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CourseBlocksIndex from './CourseBlocksIndex';
import { useCourseBlocks } from '../../hooks/useCourseBlocks';
import { useResponsive } from '../../hooks/useResponsive';
import { Block } from '../../types/block';

// Example blocks data
const exampleBlocks: Block[] = [
  {
    id: '1',
    title: 'Introduction',
    type: 'text',
    isCollapsed: false,
    isCompleted: true,
    content: 'Welcome to the course! This is an introduction to the main concepts we will cover.',
  },
  {
    id: '2',
    title: 'Chapter 1',
    type: 'text',
    isCollapsed: true,
    isCompleted: false,
    content: 'In this chapter, we will explore the fundamental concepts of the subject.',
  },
  {
    id: '3',
    title: 'Chapter 2',
    type: 'text',
    isCollapsed: true,
    isLocked: true,
    content: 'Building upon the basics, this chapter delves deeper into advanced topics.',
  },
  {
    id: '4',
    title: 'Assignment 1',
    type: 'assignment',
    isCollapsed: false,
    isCompleted: false,
    content: 'Complete the following exercises to test your understanding.',
  },
];

const CoursePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isMobile: isMobileDevice } = useResponsive();
  const [isIndexOpen, setIsIndexOpen] = useState(!isMobileDevice);

  const {
    blocks,
    currentBlockId,
    handleBlockSelect,
    handleBlockUncollapse,
    registerBlockRef,
  } = useCourseBlocks({ initialBlocks: exampleBlocks });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box sx={{ flex: 1, p: 3 }}>
        {isMobileDevice && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => setIsIndexOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">
              Course Content
            </Typography>
          </Box>
        )}
        
        {blocks.map(block => (
          <Paper
            key={block.id}
            ref={(el) => registerBlockRef(block.id, el)}
            sx={{
              p: 3,
              mb: 3,
              display: block.isCollapsed ? 'none' : 'block',
              borderLeft: block.id === currentBlockId ? '4px solid #2196f3' : 'none',
              transition: 'all 0.3s ease',
              opacity: block.isLocked ? 0.7 : 1,
            }}
          >
            <Typography variant="h5" gutterBottom>
              {block.title}
            </Typography>
            <Typography variant="body1">
              {block.content}
            </Typography>
          </Paper>
        ))}
      </Box>
      
      <CourseBlocksIndex
        blocks={blocks}
        currentBlockId={currentBlockId}
        onBlockSelect={handleBlockSelect}
        onBlockUncollapse={handleBlockUncollapse}
      />
    </Box>
  );
};

export default CoursePage; 