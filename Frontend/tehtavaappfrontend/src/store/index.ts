import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './slices/courseSlice';
import notificationReducer from './slices/notificationSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import groupReducer from './slices/groupSlice';
import materialReducer from './slices/materialSlice';
import uiReducer from './slices/uiSlice';

// Simple Redux store with minimal configuration to avoid initialization issues
export const store = configureStore({
  reducer: {
    courses: courseReducer,
    notifications: notificationReducer,
    auth: authReducer,
    users: userReducer,
    groups: groupReducer,
    materials: materialReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      // Disable serializable check in production for better performance
      serializableCheck: process.env.NODE_ENV === 'production' ? false : {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
      // Disable immutable check in production for better performance
      immutableCheck: process.env.NODE_ENV === 'production' ? false : undefined,
    }),
  // Disable devTools in production for better performance
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript usage
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
