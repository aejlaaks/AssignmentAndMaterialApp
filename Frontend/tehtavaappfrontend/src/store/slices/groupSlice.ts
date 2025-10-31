import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ISchoolGroup, groupService } from '../../services';

interface GroupState {
    groups: ISchoolGroup[];
    currentGroup: ISchoolGroup | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: GroupState = {
    groups: [],
    currentGroup: null,
    status: 'idle',
    error: null,
};

// Async thunks
export const fetchGroups = createAsyncThunk(
    'groups/fetchGroups',
    async (_, thunkAPI) => {
        try {
            const response = await groupService.getGroups();
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
        }
    }
);

export const fetchGroup = createAsyncThunk(
    'groups/fetchGroup',
    async (id: string, thunkAPI) => {
        try {
            const response = await groupService.getGroupById(id);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch group');
        }
    }
);

export const addGroup = createAsyncThunk(
    'groups/addGroup',
    async (group: { name: string; description: string; courseIds?: string[] }, thunkAPI) => {
        try {
            const response = await groupService.createGroup(group);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add group');
        }
    }
);

export const editGroup = createAsyncThunk(
    'groups/editGroup',
    async ({ id, group }: { id: string; group: { name: string; description: string } }, thunkAPI) => {
        try {
            const response = await groupService.updateGroup(id, group);
            return response;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update group');
        }
    }
);

export const removeGroup = createAsyncThunk(
    'groups/removeGroup',
    async (id: string, thunkAPI) => {
        try {
            await groupService.deleteGroup(id);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete group');
        }
    }
);

// Slice
const groupSlice = createSlice({
    name: 'groups',
    initialState,
    reducers: {
        clearCurrentGroup(state) {
            state.currentGroup = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGroups.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<ISchoolGroup[]>) => {
                state.status = 'succeeded';
                state.groups = action.payload;
            })
            .addCase(fetchGroups.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchGroup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchGroup.fulfilled, (state, action: PayloadAction<ISchoolGroup>) => {
                state.status = 'succeeded';
                state.currentGroup = action.payload;
            })
            .addCase(fetchGroup.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addGroup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addGroup.fulfilled, (state, action: PayloadAction<ISchoolGroup>) => {
                state.status = 'succeeded';
                state.groups.push(action.payload);
            })
            .addCase(addGroup.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(editGroup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(editGroup.fulfilled, (state, action: PayloadAction<ISchoolGroup | null>) => {
                state.status = 'succeeded';
                if (action.payload) {
                    const index = state.groups.findIndex(g => g.id === action.payload?.id);
                    if (index !== -1) {
                        state.groups[index] = action.payload;
                    }
                    if (state.currentGroup?.id === action.payload.id) {
                        state.currentGroup = action.payload;
                    }
                }
            })
            .addCase(editGroup.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(removeGroup.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(removeGroup.fulfilled, (state, action: PayloadAction<string>) => {
                state.status = 'succeeded';
                state.groups = state.groups.filter(g => g.id !== action.payload);
                if (state.currentGroup?.id === action.payload) {
                    state.currentGroup = null;
                }
            })
            .addCase(removeGroup.rejected, (state, action: PayloadAction<any>) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});

export const { clearCurrentGroup } = groupSlice.actions;

export default groupSlice.reducer;
