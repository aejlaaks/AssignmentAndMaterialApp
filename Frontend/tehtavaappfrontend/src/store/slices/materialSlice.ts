import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IMaterial, Material as MaterialType } from '../../services/materials/materialTypes';
import { materialService } from '../../services/materials/materialService';
import { RootState } from '../../store';
import { Material as ApiMaterial } from '../../types/Material';

interface MaterialState {
    materials: IMaterial[];
    currentMaterial: IMaterial | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: MaterialState = {
    materials: [],
    currentMaterial: null,
    status: 'idle',
    error: null,
};

// Helper function to convert Material to IMaterial with proper type field
const convertToIMaterial = (material: ApiMaterial): IMaterial => ({
    ...material,
    // Add required fields from MaterialType that might be missing in ApiMaterial
    type: (material as any).type || 'Document', // Default type if not provided
    description: material.description || '',
    createdAt: material.createdAt || new Date().toISOString()
});

// Async thunks
export const fetchMaterials = createAsyncThunk<IMaterial[], string>(
    'materials/fetchMaterials',
    async (courseId: string, thunkAPI) => {
        try {
            const response = await materialService.getMaterials(courseId);
            // Convert Material[] to IMaterial[] with proper type handling
            return response.map((material) => convertToIMaterial(material));
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch materials');
        }
    }
);

export const fetchMaterial = createAsyncThunk<IMaterial, string>(
    'materials/fetchMaterial',
    async (id: string, thunkAPI) => {
        try {
            const response = await materialService.getMaterialById(id);
            // Convert Material to IMaterial with proper type handling
            return convertToIMaterial(response);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch material');
        }
    }
);

export const addMaterial = createAsyncThunk<IMaterial, Omit<IMaterial, 'id' | 'createdAt'>>(
    'materials/addMaterial',
    async (material, thunkAPI) => {
        try {
            // Convert to the type expected by materialService
            const materialData = {
                title: material.title,
                description: material.description,
                type: material.type,
                courseId: material.courseId,
                content: material.content,
                fileType: material.fileType,
                contentType: material.contentType
            };
            
            const response = await materialService.createMaterial(materialData);
            // Convert API response to IMaterial with proper type handling
            return convertToIMaterial(response);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add material');
        }
    }
);

export const editMaterial = createAsyncThunk<IMaterial, { id: string; material: Partial<MaterialType> }>(
    'materials/editMaterial',
    async ({ id, material }, thunkAPI) => {
        try {
            const response = await materialService.updateMaterial(id, material);
            // Convert Material to IMaterial with proper type handling
            return convertToIMaterial(response);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update material');
        }
    }
);

export const removeMaterial = createAsyncThunk(
    'materials/removeMaterial',
    async (id: string, thunkAPI) => {
        try {
            await materialService.deleteMaterial(id);
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete material');
        }
    }
);

// Slice
const materialSlice = createSlice({
    name: 'materials',
    initialState,
    reducers: {
        clearCurrentMaterial(state) {
            state.currentMaterial = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMaterials.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchMaterials.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.materials = action.payload;
            })
            .addCase(fetchMaterials.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(fetchMaterial.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchMaterial.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentMaterial = action.payload;
            })
            .addCase(fetchMaterial.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(addMaterial.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(addMaterial.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.materials.push(action.payload);
            })
            .addCase(addMaterial.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(editMaterial.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(editMaterial.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.materials.findIndex((m) => m.id === action.payload.id);
                if (index !== -1) {
                    state.materials[index] = action.payload;
                }
                if (state.currentMaterial?.id === action.payload.id) {
                    state.currentMaterial = action.payload;
                }
            })
            .addCase(editMaterial.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(removeMaterial.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(removeMaterial.fulfilled, (state, action: PayloadAction<string>) => {
                state.status = 'succeeded';
                state.materials = state.materials.filter((m) => m.id !== action.payload);
                if (state.currentMaterial?.id === action.payload) {
                    state.currentMaterial = null;
                }
            })
            .addCase(removeMaterial.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentMaterial } = materialSlice.actions;

export default materialSlice.reducer;
