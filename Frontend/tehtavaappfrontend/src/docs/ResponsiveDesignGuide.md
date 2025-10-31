# Responsive Design Guide

This guide outlines our standardized approach to responsive design in the TehtäväApp frontend application.

## Overview

We use Material UI's responsive system as our primary approach for responsive design. This ensures consistency across components and leverages Material UI's built-in responsive capabilities.

## Breakpoints

We follow Material UI's breakpoint system:

- `xs`: 0px and up
- `sm`: 600px and up
- `md`: 960px and up
- `lg`: 1280px and up
- `xl`: 1920px and up

These breakpoints are configured to match in both Material UI and Tailwind CSS (via our tailwind.config.js).

## Responsive Utilities

We've created a set of responsive utilities in `src/utils/responsiveUtils.ts` to standardize common responsive patterns:

### Hooks

- `useBreakpoint(breakpoint, direction)`: A hook to check if the current viewport matches a breakpoint

```tsx
import { useBreakpoint } from '../utils/responsiveUtils';

const MyComponent = () => {
  const isMobile = useBreakpoint('sm', 'down');
  
  return (
    <div>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
};
```

### Responsive Classes

We provide a set of predefined responsive styles that can be used with Material UI's `sx` prop:

```tsx
import { Box } from '@mui/material';
import { responsiveClasses } from '../utils/responsiveUtils';

const MyComponent = () => {
  return (
    <Box
      sx={{
        ...responsiveClasses.flexColSm, // Column on mobile, row on tablet and up
        ...responsiveClasses.fullWidthSm, // Full width on mobile, auto width on tablet and up
      }}
    >
      Content
    </Box>
  );
};
```

## Best Practices

1. **Use Material UI's sx prop for responsive styles**

   ```tsx
   <Box
     sx={{
       display: 'flex',
       flexDirection: { xs: 'column', sm: 'row' },
       width: { xs: '100%', sm: 'auto' },
     }}
   >
     Content
   </Box>
   ```

2. **Use our responsive utilities for common patterns**

   ```tsx
   <Box
     sx={{
       display: 'flex',
       ...responsiveClasses.flexColSm,
       ...responsiveClasses.fullWidthSm,
     }}
   >
     Content
   </Box>
   ```

3. **Avoid mixing Tailwind responsive classes with Material UI**

   Instead of:
   ```tsx
   <div className="flex flex-col sm:flex-row w-full sm:w-auto">
     Content
   </div>
   ```

   Use:
   ```tsx
   <Box
     sx={{
       display: 'flex',
       ...responsiveClasses.flexColSm,
       ...responsiveClasses.fullWidthSm,
     }}
   >
     Content
   </Box>
   ```

4. **For complex layouts, use Material UI's Grid system**

   ```tsx
   <Grid container spacing={2}>
     <Grid item xs={12} sm={6} md={4}>
       Column 1
     </Grid>
     <Grid item xs={12} sm={6} md={4}>
       Column 2
     </Grid>
     <Grid item xs={12} md={4}>
       Column 3
     </Grid>
   </Grid>
   ```

5. **Use the useMediaQuery hook for conditional rendering**

   ```tsx
   import { useTheme, useMediaQuery } from '@mui/material';

   const MyComponent = () => {
     const theme = useTheme();
     const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
     
     return (
       <div>
         {isMobile ? <MobileView /> : <DesktopView />}
       </div>
     );
   };
   ```

## Migration Guide

When migrating components from Tailwind responsive classes to Material UI:

1. Replace Tailwind container classes with Material UI's `Container` component
2. Replace Tailwind flex classes with Material UI's `Box` component and `sx` prop
3. Replace Tailwind responsive classes (sm:, md:, etc.) with Material UI's responsive object syntax
4. Use our responsive utilities for common patterns

### Example Migration

**Before (with Tailwind):**
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
  <div className="flex items-center">
    <IconButton className="mr-2">
      <ArrowBackIcon />
    </IconButton>
    <Typography className="text-xl md:text-2xl font-bold">
      {title}
    </Typography>
  </div>
  <div className="mt-2 sm:mt-0 w-full sm:w-auto">
    <Button className="w-full sm:w-auto">
      {label}
    </Button>
  </div>
</div>
```

**After (with Material UI):**
```tsx
<Box
  sx={{
    display: 'flex',
    ...responsiveClasses.flexColSm,
    ...responsiveClasses.itemsStartSm,
    justifyContent: 'space-between',
    gap: 4,
    mb: 6,
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <IconButton sx={{ mr: 2 }}>
      <ArrowBackIcon />
    </IconButton>
    <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 'bold' }}>
      {title}
    </Typography>
  </Box>
  <Box sx={{ mt: { xs: 2, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
    <Button sx={{ width: { xs: '100%', sm: 'auto' } }}>
      {label}
    </Button>
  </Box>
</Box>
``` 