import { type FC } from 'react';
import {
  Box,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  SearchOff as SearchOffIcon,
  InboxOutlined as InboxIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';

type NoDataVariant = 'empty' | 'search' | 'error';

interface NoDataProps {
  message: string;
  variant?: NoDataVariant;
  icon?: React.ReactNode;
  iconSize?: number;
  iconColor?: string;
  textVariant?: 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  textColor?: string;
  spacing?: number;
  sx?: SxProps<Theme>;
}

const getDefaultIcon = (variant: NoDataVariant) => {
  switch (variant) {
    case 'search':
      return <SearchOffIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'empty':
    default:
      return <InboxIcon />;
  }
};

export const NoData: FC<NoDataProps> = ({
  message,
  variant = 'empty',
  icon,
  iconSize = 48,
  iconColor = 'text.secondary',
  textVariant = 'body1',
  textColor = 'text.secondary',
  spacing = 2,
  sx,
}) => {
  const displayIcon = icon || getDefaultIcon(variant);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        minHeight: 200,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
          mb: spacing,
          '& > svg': {
            fontSize: iconSize,
          },
        }}
      >
        {displayIcon}
      </Box>
      <Typography
        variant={textVariant}
        color={textColor}
        align="center"
        sx={{
          maxWidth: 300,
          mx: 'auto',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};
