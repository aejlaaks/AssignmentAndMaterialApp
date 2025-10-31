import React from 'react';
import { Box } from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { Block } from '../../types/block';

interface BlockTypeIconProps {
  type: string;
  size?: number;
  color?: string;
}

const BlockTypeIcon: React.FC<BlockTypeIconProps> = ({ 
  type, 
  size = 20,
  color = '#757575'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'text':
        return <TextFieldsIcon sx={{ fontSize: size, color }} />;
      case 'assignment':
        return <AssignmentIcon sx={{ fontSize: size, color }} />;
      case 'code':
        return <CodeIcon sx={{ fontSize: size, color }} />;
      case 'quiz':
        return <QuizIcon sx={{ fontSize: size, color }} />;
      case 'image':
        return <ImageIcon sx={{ fontSize: size, color }} />;
      case 'video':
        return <VideoLibraryIcon sx={{ fontSize: size, color }} />;
      default:
        return <TextFieldsIcon sx={{ fontSize: size, color }} />;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: size + 8,
      height: size + 8,
      mr: 1
    }}>
      {getIcon()}
    </Box>
  );
};

export default BlockTypeIcon; 