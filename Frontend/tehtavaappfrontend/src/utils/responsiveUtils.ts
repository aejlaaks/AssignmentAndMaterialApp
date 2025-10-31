import { useTheme, useMediaQuery } from '@mui/material';

// Breakpoint types matching Material UI breakpoints
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Hook to check if the current viewport matches a breakpoint
export const useBreakpoint = (breakpoint: Breakpoint, direction: 'up' | 'down' = 'up') => {
  const theme = useTheme();
  return useMediaQuery(direction === 'up' 
    ? theme.breakpoints.up(breakpoint) 
    : theme.breakpoints.down(breakpoint));
};

// Convert Tailwind responsive classes to Material UI sx props
export const responsiveClasses = {
  // Flex direction utilities
  flexCol: { xs: { flexDirection: 'column' } },
  flexRow: { xs: { flexDirection: 'row' } },
  flexColSm: { 
    xs: { flexDirection: 'column' },
    sm: { flexDirection: 'row' }
  },
  flexRowSm: {
    xs: { flexDirection: 'row' },
    sm: { flexDirection: 'column' }
  },
  
  // Width utilities
  fullWidth: { xs: { width: '100%' } },
  autoWidth: { xs: { width: 'auto' } },
  fullWidthSm: {
    xs: { width: '100%' },
    sm: { width: 'auto' }
  },
  
  // Alignment utilities
  itemsStart: { xs: { alignItems: 'flex-start' } },
  itemsCenter: { xs: { alignItems: 'center' } },
  itemsStartSm: {
    xs: { alignItems: 'flex-start' },
    sm: { alignItems: 'center' }
  },
  
  // Justify content utilities
  justifyStart: { xs: { justifyContent: 'flex-start' } },
  justifyBetween: { xs: { justifyContent: 'space-between' } },
  justifyCenter: { xs: { justifyContent: 'center' } },
  justifyEnd: { xs: { justifyContent: 'flex-end' } },
  
  // Display utilities
  hidden: { xs: { display: 'none' } },
  block: { xs: { display: 'block' } },
  flex: { xs: { display: 'flex' } },
  hiddenSm: {
    xs: { display: 'none' },
    sm: { display: 'block' }
  },
  hiddenMd: {
    xs: { display: 'none' },
    md: { display: 'block' }
  },
  visibleSm: {
    xs: { display: 'block' },
    sm: { display: 'none' }
  },
  visibleMd: {
    xs: { display: 'block' },
    md: { display: 'none' }
  },
  
  // Text alignment
  textCenter: { xs: { textAlign: 'center' } },
  textLeft: { xs: { textAlign: 'left' } },
  textRight: { xs: { textAlign: 'right' } },
  
  // Margin utilities
  mt0: { xs: { marginTop: 0 } },
  mt2: { xs: { marginTop: 2 } },
  mt0Sm: {
    xs: { marginTop: 2 },
    sm: { marginTop: 0 }
  },
  
  // Gap utilities
  gap2: { xs: { gap: 2 } },
  gap4: { xs: { gap: 4 } },
};

// Helper function to combine responsive styles
export const combineResponsiveStyles = (...styles: Record<string, any>[]) => {
  return styles.reduce((acc, style) => {
    return { ...acc, ...style };
  }, {});
}; 