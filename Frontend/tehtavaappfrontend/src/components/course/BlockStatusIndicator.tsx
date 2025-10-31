import React from 'react';
import { Box, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockIcon from '@mui/icons-material/Lock';
import { Block } from '../../types/block';

interface BlockStatusIndicatorProps {
  block: Block;
  size?: number;
}

const BlockStatusIndicator: React.FC<BlockStatusIndicatorProps> = ({ 
  block,
  size = 16
}) => {
  const getStatusIcon = () => {
    if (block.isLocked) {
      return (
        <Tooltip title="Locked">
          <LockIcon sx={{ fontSize: size, color: '#9e9e9e' }} />
        </Tooltip>
      );
    }

    if (block.isCompleted) {
      return (
        <Tooltip title="Completed">
          <CheckCircleIcon sx={{ fontSize: size, color: '#4caf50' }} />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Not completed">
        <RadioButtonUncheckedIcon sx={{ fontSize: size, color: '#9e9e9e' }} />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      ml: 1
    }}>
      {getStatusIcon()}
    </Box>
  );
};

export default BlockStatusIndicator; 