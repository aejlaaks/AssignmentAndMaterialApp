import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EntityState {
  entity: string;
  loading?: boolean;
  error?: string | null;
  message?: string;
}

interface UiState {
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  success: Record<string, string | null>;
}

const initialState: UiState = {
  loading: {},
  errors: {},
  success: {}
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ entity: string; loading: boolean }>) => {
      const { entity, loading } = action.payload;
      state.loading[entity] = loading;
    },
    setError: (state, action: PayloadAction<{ entity: string; error: string | null }>) => {
      const { entity, error } = action.payload;
      state.errors[entity] = error;
    },
    setSuccess: (state, action: PayloadAction<{ entity: string; message: string }>) => {
      const { entity, message } = action.payload;
      state.success[entity] = message;
      
      // Clear the success message after a delay
      setTimeout(() => {
        state.success[entity] = null;
      }, 5000);
    },
    clearError: (state, action: PayloadAction<string>) => {
      const entity = action.payload;
      state.errors[entity] = null;
    },
    clearSuccess: (state, action: PayloadAction<string>) => {
      const entity = action.payload;
      state.success[entity] = null;
    },
    resetUiState: (state) => {
      state.loading = {};
      state.errors = {};
      state.success = {};
    }
  }
});

export const {
  setLoading,
  setError,
  setSuccess,
  clearError,
  clearSuccess,
  resetUiState
} = uiSlice.actions;

export default uiSlice.reducer; 