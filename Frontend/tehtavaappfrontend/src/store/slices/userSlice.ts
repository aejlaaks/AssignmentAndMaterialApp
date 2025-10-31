import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUsers, getUserById, createUser, deleteUser } from '../../services/users/userService';
import { User } from '../../types';

interface UserState {
    users: User[];
    currentUser: User | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: UserState = {
    users: [],
    currentUser: null,
    status: 'idle',
    error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, thunkAPI) => {
        try {
            const response = await getUsers();
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
        }
    }
);

export const fetchUser = createAsyncThunk(
    'users/fetchUser',
    async (id: string, thunkAPI) => {
        try {
            const response = await getUserById(id);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
        }
    }
);

export const addUser = createAsyncThunk(
    'users/addUser',
    async (user: any, thunkAPI) => {
        try {
            const response = await createUser(user);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add user');
        }
    }
);

export const editUser = createAsyncThunk(
    'users/editUser',
    async ({ id, user }: { id: string; user: Partial<User> }, thunkAPI) => {
        try {
            // Käytä updateUserProfile-funktiota updateUser-funktion sijaan
            const response = await fetch(`https://localhost:5001/api/user/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(user)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            
            const data = await response.json();
            return data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message || 'Failed to update user');
        }
    }
);

export const removeUser = createAsyncThunk(
    'users/removeUser',
    async (id: string, thunkAPI) => {
        try {
            await deleteUser(id);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete user');
        }
    }
);

// Slice
const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearCurrentUser(state) {
            state.currentUser = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
                state.status = 'succeeded';
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'succeeded';
                state.currentUser = action.payload;
            })
            .addCase(fetchUser.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'succeeded';
                state.users.push(action.payload);
            })
            .addCase(addUser.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(editUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(editUser.fulfilled, (state, action: PayloadAction<User>) => {
                state.status = 'succeeded';
                const index = state.users.findIndex((u: User) => u.id === action.payload.id);
                if (index !== -1) {
                    state.users[index] = action.payload;
                }
                if (state.currentUser?.id === action.payload.id) {
                    state.currentUser = action.payload;
                }
            })
            .addCase(editUser.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(removeUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(removeUser.fulfilled, (state, action: PayloadAction<string>) => {
                state.status = 'succeeded';
                state.users = state.users.filter((u: User) => u.id !== action.payload);
                if (state.currentUser?.id === action.payload) {
                    state.currentUser = null;
                }
            })
            .addCase(removeUser.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { clearCurrentUser } = userSlice.actions;

export default userSlice.reducer;
