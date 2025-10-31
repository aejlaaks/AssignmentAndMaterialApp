import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { type User, type AuthState, type RootState } from '../../types';
import { authService } from '../../services/auth/authService';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await authService.login(credentials);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updatedUserData: Partial<User>, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(updatedUserData);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser(state) {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isLoading = false;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoading = false;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Export actions and reducer
export const { clearUser } = authSlice.actions;
export default authSlice.reducer;

// Selector
export const selectAuth = (state: RootState) => state.auth;
