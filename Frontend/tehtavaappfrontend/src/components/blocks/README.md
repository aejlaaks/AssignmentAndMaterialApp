# Drag and Drop Migration Guide

## Migration from react-beautiful-dnd to @dnd-kit

This project is in the process of migrating from `react-beautiful-dnd` to `@dnd-kit` for drag-and-drop functionality. This migration addresses several issues:

1. Stability issues with `react-beautiful-dnd`
2. Better TypeScript support with `@dnd-kit`
3. More flexible and customizable drag-and-drop experience
4. Active maintenance of `@dnd-kit` vs. stagnant development of `react-beautiful-dnd`

## New Components

The following new components have been created:

- `BlockListNew.tsx`: A replacement for `BlockList.tsx` using `@dnd-kit/sortable`
- `BlockRendererNew.tsx`: A replacement for `BlockRenderer.tsx` with updated props for `@dnd-kit`
- `NestedBlockList.tsx`: A new component that supports drag-and-drop between containers

## How to Use

### Basic Sortable List

```tsx
import { BlockListNew } from '../../components/blocks/BlockListNew';

// In your component:
<BlockListNew
  blocks={blocks}
  onReorder={handleReorderBlocks}
  onEdit={handleEditBlock}
  onDelete={handleDeleteBlock}
  isPreviewMode={isPreviewMode}
/>
```

### Nested Sortable List (Drag Between Containers)

```tsx
import { NestedBlockList } from '../../components/blocks/NestedBlockList';

// In your component:
<NestedBlockList
  blocks={blocks}
  onBlocksChange={handleReorderBlocks}
  onEdit={handleEditBlock}
  onDelete={handleDeleteBlock}
  isPreviewMode={isPreviewMode}
/>
```

## Implementation Details

### @dnd-kit/core

The core library provides the `DndContext` component and hooks for basic drag-and-drop functionality.

### @dnd-kit/sortable

This extension provides sortable functionality with the `SortableContext` component and `useSortable` hook.

### @dnd-kit/utilities

Provides utility functions for creating unique IDs and other helpers.

## Migration Strategy

1. Create new components using `@dnd-kit` alongside existing components
2. Update parent components to use the new implementations
3. Test thoroughly to ensure functionality is maintained
4. Remove old implementations once migration is complete

## Known Issues

- Type errors may occur when passing props between components
- Ensure proper type assertions are used when working with block types
- Some styling adjustments may be needed for optimal appearance

## Resources

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Sortable Example](https://docs.dndkit.com/presets/sortable)
- [Multiple Containers Example](https://docs.dndkit.com/patterns/multiple-containers) 