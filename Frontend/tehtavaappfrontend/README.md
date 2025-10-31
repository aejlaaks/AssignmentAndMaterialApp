# TehtäväApp Frontend

This is the frontend application for TehtäväApp, a learning management system.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Responsive Design Guidelines

We've standardized our approach to responsive design to ensure consistency across the application. 

### Key Principles

1. **Use Material UI's responsive system** as the primary approach for responsive design
2. **Avoid mixing Tailwind responsive classes with Material UI components**
3. **Use our responsive utilities** for common responsive patterns

### Responsive Utilities

We've created a set of responsive utilities in `src/utils/responsiveUtils.ts` to standardize common responsive patterns:

```tsx
import { Box } from '@mui/material';
import { responsiveClasses } from '../utils/responsiveUtils';

const MyComponent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        ...responsiveClasses.flexColSm, // Column on mobile, row on tablet and up
        ...responsiveClasses.fullWidthSm, // Full width on mobile, auto width on tablet and up
      }}
    >
      Content
    </Box>
  );
};
```

### Breakpoints

We follow Material UI's breakpoint system:

- `xs`: 0px and up
- `sm`: 600px and up
- `md`: 960px and up
- `lg`: 1280px and up
- `xl`: 1920px and up

### Responsive Hooks

Use the `useBreakpoint` hook for conditional rendering based on screen size:

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

For more detailed guidelines, see the [Responsive Design Guide](./src/docs/ResponsiveDesignGuide.md).

## Project Structure

- `src/components`: Reusable UI components
- `src/pages`: Application pages
- `src/services`: API services
- `src/hooks`: Custom React hooks
- `src/utils`: Utility functions
- `src/types`: TypeScript type definitions
- `src/assets`: Static assets
- `src/layouts`: Layout components
- `src/store`: Redux store configuration
- `src/docs`: Documentation files

## Technologies Used

- React
- TypeScript
- Material UI
- Redux
- React Router
- Axios
- Tailwind CSS (being phased out in favor of Material UI's styling system)

## Notification System

The notification system provides real-time notifications for various events in the application:
- Assignment updates
- Course materials
- Grade postings
- Group changes
- System announcements

### Components

1. **NotificationProvider**
   - Manages notification state
   - Handles SignalR connection
   - Provides context for other components

2. **NotificationList**
   - Displays notifications in a list format
   - Supports filtering and sorting
   - Groups notifications by date

3. **NotificationMenu**
   - Quick access to notifications from header
   - Shows unread count
   - Provides quick actions

4. **NotificationFilters**
   - Filter by type, read status, date
   - Search functionality
   - Clear filters option

5. **NotificationPreferencesForm**
   - Configure notification channels
   - Set notification types
   - Configure digest settings

6. **NotificationSnackbar**
   - Real-time notification popups
   - Click to navigate to content
   - Auto-dismiss functionality

7. **NotificationSound**
   - Audio feedback for notifications
   - Configurable sound and volume
   - Only plays for new notifications

### Setup Instructions

1. Install dependencies:
   ```bash
   npm install @microsoft/signalr @mui/x-date-pickers @date-io/dayjs dayjs
   ```

2. Add notification sound:
   - Create a notification sound file (MP3 format)
   - Place it in: `public/assets/sounds/notification.mp3`
   - Recommended characteristics:
     - Duration: 0.5-1.5 seconds
     - Format: MP3
     - Sample rate: 44.1kHz
     - Bit rate: 128-192kbps
   - You can use any of these options:
     - Download a free notification sound from [Notification Sounds](https://notificationsounds.com/)
     - Create your own using [Online Tone Generator](https://www.szynalski.com/tone-generator/)
     - Use system notification sounds from Windows/macOS

3. Configure SignalR:
   - Update the hub URL in NotificationProvider
   - Ensure CORS is properly configured in backend
   - Test connection in browser console

### Usage

```tsx
// In components
import { useNotifications } from '../hooks/useNotifications';

const MyComponent = () => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllAsRead,
    updatePreferences,
  } = useNotifications();

  // Use notification data and functions
};

// Display notifications
<NotificationList maxHeight={400} showDelete />

// Show notification menu
<NotificationMenu />

// Add filters
<NotificationFilters onFilterChange={handleFilterChange} />

// Configure preferences
<NotificationPreferencesForm
  preferences={preferences}
  onSave={handlePreferencesUpdate}
/>
```

### Best Practices

1. **Performance**
   - Use virtualization for long lists
   - Implement pagination
   - Cache notification data

2. **Accessibility**
   - Provide ARIA labels
   - Support keyboard navigation
   - Consider screen readers

3. **User Experience**
   - Group notifications logically
   - Provide clear actions
   - Show loading states

4. **Error Handling**
   - Handle network errors
   - Provide retry options
   - Show error messages

### Contributing

1. Follow TypeScript best practices
2. Add proper documentation
3. Include unit tests
4. Follow Material-UI patterns
5. Consider accessibility
