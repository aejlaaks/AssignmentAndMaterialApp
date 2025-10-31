import { type FC } from 'react';
import {
  Badge,
  IconButton,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
  max?: number;
  sx?: SxProps<Theme>;
}

export const NotificationBadge: FC<NotificationBadgeProps> = ({
  count,
  onClick,
  color = 'error',
  size = 'medium',
  showZero = false,
  max = 99,
  sx,
}) => {
  const iconSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';
  const tooltipText = count === 0
    ? 'Ei uusia ilmoituksia'
    : count === 1
      ? '1 uusi ilmoitus'
      : `${count} uutta ilmoitusta`;

  return (
    <Tooltip title={tooltipText} arrow>
      <IconButton
        aria-label={tooltipText}
        onClick={onClick}
        size={size === 'large' ? 'large' : 'medium'}
        sx={sx}
      >
        <Badge
          badgeContent={count}
          color={color}
          max={max}
          showZero={showZero}
        >
          <NotificationsIcon fontSize={iconSize} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
