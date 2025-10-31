# Redux Implementation Plan for TehtavaApp Frontend

This document outlines our plan to migrate the application's state management to Redux, providing a centralized store and predictable state management architecture.

## Phase 1: Setup Redux Infrastructure

1. **Install Required Packages:**
   ```bash
   npm install @reduxjs/toolkit react-redux redux-persist redux-thunk
   ```

2. **Create Redux Store Structure:**
   - Create a `store` directory in `src`
   - Set up the root reducer and store configuration
   - Configure Redux DevTools for development
   - Add TypeScript types for the store and dispatch

3. **Implement Redux Persistence:**
   - Configure redux-persist to maintain state across refreshes
   - Determine which parts of the state should be persisted
   - Set up storage adapter for browser local storage

## Phase 2: Create Block-Related Redux Slices

1. **Block Content Slice:**
   - Migrate block data management from `useBlocks` hook
   - Implement actions for CRUD operations on blocks:
     - addBlock, updateBlock, deleteBlock, reorderBlocks
     - Support for nested blocks in groups
   - Add selectors for accessing block data

2. **Block UI State Slice:**
   - Migrate from `useBlockGroups` hook
   - Handle collapse/expand states, group locking/unlocking
   - Track selected blocks and dialog states
   - Manage UI-specific state like block editor open/close

3. **Build Async Thunks:**
   - Create thunks for API operations that affect blocks
   - Implement loading states and error handling
   - Add middleware for logging and analytics

## Phase 3: Connect UI Components to Redux

1. **Replace Context Provider with Redux:**
   - Remove the `BlockContext` provider
   - Use Redux Provider at the app root level
   - Create custom hooks for accessing Redux state

2. **Refactor Block Components:**
   - Replace `useBlockContext` hook calls with Redux selectors
   - Update components to dispatch Redux actions
   - Create selectors for optimized data access
   - Use memoization to prevent unnecessary re-renders

3. **Migrate Block Dialogs:**
   - Update dialog state management to use Redux
   - Refactor form submissions to dispatch actions
   - Implement modular form state handling

## Phase 4: Extend Redux to Other Application Areas

1. **User Authentication Slice:**
   - Login/logout functionality
   - User roles and permissions
   - Session management and refresh tokens

2. **Course Management Slice:**
   - Course data, enrollment, and progress tracking
   - Assignment submission and grading
   - Course content organization

3. **UI Preferences Slice:**
   - Theme preferences (light/dark mode)
   - Layout configurations
   - User-specific settings
   - Notification settings

## Phase 5: Performance Optimization and Testing

1. **Implement Memoized Selectors:**
   - Use `createSelector` to avoid unnecessary re-renders
   - Structure selectors to match UI component hierarchies
   - Profile and optimize selector performance

2. **Add Unit Tests:**
   - Test reducers, action creators, and selectors
   - Verify state transitions work as expected
   - Test async thunks with mock API responses

3. **Add Integration Tests:**
   - Test the connected components
   - Verify Redux store interactions
   - End-to-end tests for critical user flows

## Implementation Examples

### Store Configuration

```typescript
// src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import blocksReducer from './slices/blocksSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['blocks', 'auth', 'ui']
};

const rootReducer = combineReducers({
  blocks: blocksReducer,
  ui: uiReducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Block Slice Example

```typescript
// src/store/slices/blocksSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockGroup } from '../../types/blocks';
import { blocksApi } from '../../api/blocksApi';

interface BlocksState {
  blocks: Block[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BlocksState = {
  blocks: [],
  loading: 'idle',
  error: null
};

// Async thunks
export const fetchBlocks = createAsyncThunk(
  'blocks/fetchBlocks',
  async (courseId: string) => {
    const response = await blocksApi.getBlocks(courseId);
    return response.data;
  }
);

export const saveBlock = createAsyncThunk(
  'blocks/saveBlock',
  async (block: Block) => {
    const response = await blocksApi.saveBlock(block);
    return response.data;
  }
);

const blocksSlice = createSlice({
  name: 'blocks',
  initialState,
  reducers: {
    addBlock: (state, action: PayloadAction<Block>) => {
      const newBlock = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
        order: state.blocks.length
      };
      state.blocks.push(newBlock);
    },
    updateBlock: (state, action: PayloadAction<Block>) => {
      const index = state.blocks.findIndex(block => block.id === action.payload.id);
      if (index !== -1) {
        state.blocks[index] = action.payload;
      }
    },
    deleteBlock: (state, action: PayloadAction<string>) => {
      state.blocks = state.blocks.filter(block => block.id !== action.payload);
    },
    reorderBlocks: (state, action: PayloadAction<Block[]>) => {
      state.blocks = action.payload.map((block, index) => ({
        ...block,
        order: index
      }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlocks.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchBlocks.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.blocks = action.payload;
      })
      .addCase(fetchBlocks.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.error.message || 'Failed to fetch blocks';
      });
  }
});

export const { addBlock, updateBlock, deleteBlock, reorderBlocks } = blocksSlice.actions;
export default blocksSlice.reducer;
```

### UI Slice Example

```typescript
// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedBlockId: string | null;
  isDialogOpen: boolean;
  collapsedBlocks: string[];
  unlockedGroups: string[];
}

const initialState: UiState = {
  selectedBlockId: null,
  isDialogOpen: false,
  collapsedBlocks: [],
  unlockedGroups: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedBlock: (state, action: PayloadAction<string | null>) => {
      state.selectedBlockId = action.payload;
    },
    openDialog: (state) => {
      state.isDialogOpen = true;
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
      state.selectedBlockId = null;
    },
    toggleBlockCollapse: (state, action: PayloadAction<string>) => {
      const blockId = action.payload;
      const index = state.collapsedBlocks.indexOf(blockId);
      
      if (index !== -1) {
        state.collapsedBlocks.splice(index, 1);
      } else {
        state.collapsedBlocks.push(blockId);
      }
    },
    toggleGroupLock: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      const index = state.unlockedGroups.indexOf(groupId);
      
      if (index !== -1) {
        state.unlockedGroups.splice(index, 1);
      } else {
        state.unlockedGroups.push(groupId);
      }
    }
  }
});

export const { 
  setSelectedBlock, 
  openDialog, 
  closeDialog, 
  toggleBlockCollapse, 
  toggleGroupLock 
} = uiSlice.actions;

export default uiSlice.reducer;
```

### Custom Hooks Example

```typescript
// src/hooks/useReduxBlocks.ts
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  addBlock, 
  updateBlock, 
  deleteBlock, 
  reorderBlocks 
} from '../store/slices/blocksSlice';
import { 
  setSelectedBlock, 
  openDialog, 
  closeDialog, 
  toggleBlockCollapse, 
  toggleGroupLock 
} from '../store/slices/uiSlice';
import { Block } from '../types/blocks';

export const useReduxBlocks = () => {
  const dispatch = useDispatch();
  const blocks = useSelector((state: RootState) => state.blocks.blocks);
  const selectedBlockId = useSelector((state: RootState) => state.ui.selectedBlockId);
  const isDialogOpen = useSelector((state: RootState) => state.ui.isDialogOpen);
  const collapsedBlocks = useSelector((state: RootState) => state.ui.collapsedBlocks);
  const unlockedGroups = useSelector((state: RootState) => state.ui.unlockedGroups);

  const selectedBlock = useSelector((state: RootState) => {
    if (!state.ui.selectedBlockId) return null;
    return state.blocks.blocks.find(block => block.id === state.ui.selectedBlockId) || null;
  });

  // Block CRUD actions
  const handleAddBlock = useCallback((block: Block) => {
    dispatch(addBlock(block));
  }, [dispatch]);

  const handleUpdateBlock = useCallback((block: Block) => {
    dispatch(updateBlock(block));
  }, [dispatch]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    dispatch(deleteBlock(blockId));
  }, [dispatch]);

  const handleReorderBlocks = useCallback((reorderedBlocks: Block[]) => {
    dispatch(reorderBlocks(reorderedBlocks));
  }, [dispatch]);

  // UI actions
  const handleOpenCreateDialog = useCallback(() => {
    dispatch(setSelectedBlock(null));
    dispatch(openDialog());
  }, [dispatch]);

  const handleOpenEditDialog = useCallback((block: Block) => {
    dispatch(setSelectedBlock(block.id));
    dispatch(openDialog());
  }, [dispatch]);

  const handleCloseDialog = useCallback(() => {
    dispatch(closeDialog());
  }, [dispatch]);

  const handleToggleBlockCollapse = useCallback((blockId: string) => {
    dispatch(toggleBlockCollapse(blockId));
  }, [dispatch]);

  const handleToggleGroupLock = useCallback((groupId: string) => {
    dispatch(toggleGroupLock(groupId));
  }, [dispatch]);

  // Helper functions
  const isBlockCollapsed = useCallback((blockId: string) => {
    return collapsedBlocks.includes(blockId);
  }, [collapsedBlocks]);

  const isGroupUnlocked = useCallback((groupId: string) => {
    return unlockedGroups.includes(groupId);
  }, [unlockedGroups]);

  return {
    // State
    blocks,
    selectedBlock,
    selectedBlockId,
    isDialogOpen,
    collapsedBlocks,
    unlockedGroups,
    
    // Actions
    addBlock: handleAddBlock,
    updateBlock: handleUpdateBlock,
    deleteBlock: handleDeleteBlock,
    reorderBlocks: handleReorderBlocks,
    openCreateDialog: handleOpenCreateDialog,
    openEditDialog: handleOpenEditDialog,
    closeDialog: handleCloseDialog,
    toggleBlockCollapse: handleToggleBlockCollapse,
    toggleGroupLock: handleToggleGroupLock,
    
    // Helpers
    isBlockCollapsed,
    isGroupUnlocked
  };
};
```

## Benefits of This Approach

1. **Centralized State Management:** All application state is stored in a single place, making it easier to understand, debug, and maintain.

2. **Predictable State Updates:** State changes follow a unidirectional data flow, making it easier to track how state changes over time.

3. **Developer Tools:** Redux DevTools provides powerful debugging capabilities, including time-travel debugging and action inspection.

4. **Middleware Support:** Easy integration of middleware for logging, crash reporting, routing, and async operations.

5. **Persistence:** Built-in support for persisting state across page refreshes and browser sessions.

6. **TypeScript Integration:** Strong typing support with Redux Toolkit makes state management more robust and helps catch errors early.

7. **Performance Optimization:** Memoized selectors prevent unnecessary re-renders and improve application performance.

8. **Testability:** Pure reducers are easy to test, and the decoupling of state management from UI components makes testing simpler.

9. **Scalability:** The Redux pattern scales well as the application grows, allowing for modular state management.

10. **Community and Documentation:** Large community and extensive documentation for support and best practices.

## Timeline and Milestones

- **Week 1:** Set up Redux infrastructure and create the first slices
- **Week 2:** Migrate block components to Redux
- **Week 3:** Extend Redux to other application areas
- **Week 4:** Performance optimization and testing
- **Week 5:** Final testing, bug fixes, and documentation

## Conclusion

This Redux implementation plan provides a structured approach to migrate our current Context-based state management to a comprehensive Redux solution. The migration will be performed incrementally, ensuring minimal disruption to existing functionality while improving the overall maintainability and performance of the application. 