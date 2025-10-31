import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme';
import { NotificationType } from './types';

// Create initial state types
interface AuthState {
  user: null | { id: string; name: string; email: string };
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface NotificationState {
  notifications: {
    id: string;
    type: NotificationType;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata?: Record<string, any>;
  }[];
  preferences: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    types: NotificationType[];
    schedule: {
      digest: boolean;
      frequency: 'daily' | 'weekly';
      time: string;
    };
  } | null;
  loading: boolean;
  error: string | null;
}

// Create initial state
const initialState = {
  auth: {
    user: null,
    token: null,
    loading: false,
    error: null,
  } as AuthState,
  notifications: {
    notifications: [],
    preferences: null,
    loading: false,
    error: null,
  } as NotificationState,
};

// Create a mock store
const createMockStore = (preloadedState = initialState) => {
  return configureStore({
    reducer: {
      auth: (state = preloadedState.auth, action) => state,
      notifications: (state = preloadedState.notifications, action) => state,
    },
    preloadedState,
  });
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  {
    preloadedState = initialState,
    store = createMockStore(preloadedState),
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & {
    preloadedState?: typeof initialState;
    store?: ReturnType<typeof createMockStore>;
  } = {}
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </Provider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export store creator and types
export { createMockStore, initialState };
export type { AuthState, NotificationState };

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.HTMLMediaElement
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: jest.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: jest.fn(),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});
