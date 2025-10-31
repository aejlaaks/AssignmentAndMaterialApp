import React from 'react';
import {
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { responsiveClasses } from '../../utils/responsiveUtils';

export interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  action?: ActionButton | React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
  sx?: any;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  action,
  actions,
  showBackButton = true,
  onBackClick,
  sx,
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // Check if action is an ActionButton object or a React element
  const isActionButton = (action: any): action is ActionButton => 
    action && typeof action === 'object' && 'label' in action;

  return (
    <Box
      sx={{
        display: 'flex',
        ...responsiveClasses.flexColSm,
        justifyContent: 'space-between',
        ...responsiveClasses.itemsStartSm,
        mb: 6,
        gap: 4,
        ...sx
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showBackButton && (
          <IconButton
            onClick={handleBackClick}
            sx={{ mr: 2 }}
            aria-label="takaisin"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography 
          variant="h5" 
          component="h1"
          sx={{
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            fontWeight: 'bold'
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Support both actions and legacy action prop */}
      {(actions || action) && (
        <Box sx={{
          mt: { xs: 2, sm: 0 },
          ...responsiveClasses.fullWidthSm
        }}>
          {actions ? (
            actions
          ) : isActionButton(action) ? (
            <Button
              variant="contained"
              color="primary"
              onClick={action.onClick}
              startIcon={action.icon}
              disabled={action.disabled}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              {action.label}
            </Button>
          ) : (
            action
          )}
        </Box>
      )}
    </Box>
  );
};
