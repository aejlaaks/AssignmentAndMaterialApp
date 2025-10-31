# Course Blocks Index Implementation Plan

## Overview
A collapsible index panel on the right side of the course page that shows block headers in a simple list format. Clicking an index item scrolls to the corresponding block and uncollapses it if it's collapsed.

## Features

### 1. Index Panel UI
- Collapsible panel on the right side of the course page
- Toggle button to show/hide the index
- Smooth transition animations
- Responsive design (collapses on mobile)
- Fixed position while scrolling

### 2. Block Headers Display
- Simple list of block headers
- Visual indicators for:
  - Block type (icon)
  - Current position
  - Completion status
  - Collapsed/expanded state
- Clean, minimal design

### 3. Navigation Features
- Click to scroll to block and uncollapse it
- Current block highlighted
- Quick search/filter functionality
- Smooth scroll animation to target block

## Component Structure

```typescript
// Components hierarchy
CoursePage
└── CourseBlocksIndex
    ├── IndexHeader
    │   ├── ToggleButton
    │   └── SearchInput
    └── IndexContent
        └── BlockList
            └── BlockHeaderItem
                ├── BlockIcon
                ├── BlockTitle
                └── CollapseIndicator
```

## Implementation Phases

### Phase 1: Basic Structure
1. Create the index panel component
2. Implement basic block header list
3. Add toggle functionality
4. Style the panel and animations

### Phase 2: Block Navigation
1. Implement scroll-to-block functionality
2. Add block uncollapse functionality
3. Create smooth scrolling behavior
4. Add collapse state indicators

### Phase 3: Visual Enhancements
1. Add block type icons
2. Implement status indicators
3. Style active/inactive states
4. Add collapse/expand animations

### Phase 4: Advanced Features
1. Add search functionality
2. Create mobile-responsive design

## Component Examples

### CourseBlocksIndex Component
```typescript
interface CourseBlocksIndexProps {
  blocks: Block[];
  currentBlockId: string | null;
  onBlockSelect: (blockId: string) => void;
  onBlockUncollapse: (blockId: string) => void;
}

const CourseBlocksIndex: React.FC<CourseBlocksIndexProps> = ({
  blocks,
  currentBlockId,
  onBlockSelect,
  onBlockUncollapse
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBlockClick = (blockId: string) => {
    onBlockSelect(blockId);
    onBlockUncollapse(blockId);
  };

  return (
    <IndexPanel isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      <IndexHeader>
        <ToggleButton onClick={() => setIsOpen(!isOpen)} />
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocks..."
        />
      </IndexHeader>
      
      <IndexContent>
        <BlockList>
          {blocks.map(block => (
            <BlockHeaderItem
              key={block.id}
              block={block}
              isCurrent={block.id === currentBlockId}
              isCollapsed={block.isCollapsed}
              onSelect={() => handleBlockClick(block.id)}
            />
          ))}
        </BlockList>
      </IndexContent>
    </IndexPanel>
  );
};
```

### BlockHeaderItem Component
```typescript
interface BlockHeaderItemProps {
  block: Block;
  isCurrent: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
}

const BlockHeaderItem: React.FC<BlockHeaderItemProps> = ({
  block,
  isCurrent,
  isCollapsed,
  onSelect
}) => {
  return (
    <HeaderItemContainer
      isCurrent={isCurrent}
      isCollapsed={isCollapsed}
      onClick={onSelect}
    >
      <BlockIcon type={block.type} />
      <BlockTitle>{block.title}</BlockTitle>
      {isCurrent && <CurrentIndicator />}
      {isCollapsed && <CollapseIndicator />}
    </HeaderItemContainer>
  );
};
```

## Styling

### Theme Variables
```typescript
const theme = {
  indexPanel: {
    width: '250px',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e0e0e0',
    transition: 'transform 0.3s ease',
  },
  headerItem: {
    padding: '8px 16px',
    hoverBackground: '#f5f5f5',
    currentBackground: '#e3f2fd',
    currentBorderLeft: '3px solid #2196f3',
    collapsedOpacity: 0.7,
  },
  blockIcon: {
    marginRight: '8px',
    width: '20px',
    height: '20px',
  },
  collapseIndicator: {
    marginLeft: 'auto',
    color: '#757575',
    fontSize: '16px',
  }
};
```

## Redux Integration

### Slice
```typescript
interface IndexState {
  isOpen: boolean;
  searchQuery: string;
  collapsedBlocks: string[];
}

const indexSlice = createSlice({
  name: 'courseIndex',
  initialState: {
    isOpen: true,
    searchQuery: '',
    collapsedBlocks: [],
  },
  reducers: {
    toggleIndex: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    uncollapseBlock: (state, action) => {
      const blockId = action.payload;
      state.collapsedBlocks = state.collapsedBlocks.filter(id => id !== blockId);
    },
  },
});
```

## Performance Considerations

1. **Virtualization**
   - Implement virtual scrolling for large block lists
   - Only render visible items

2. **Memoization**
   - Memoize block header components
   - Use `useCallback` for event handlers
   - Memoize scroll and uncollapse functions

3. **State Management**
   - Keep search state in Redux
   - Implement efficient search filtering
   - Cache collapse states

## Testing Plan

1. **Unit Tests**
   - Test individual components
   - Test header rendering
   - Test navigation functions
   - Test collapse/uncollapse functionality

2. **Integration Tests**
   - Test panel open/close
   - Test block selection and scrolling
   - Test block uncollapse
   - Test search functionality

## Accessibility

1. **Keyboard Navigation**
   - Arrow keys for list navigation
   - Enter to select block and uncollapse
   - Escape to close panel

2. **Screen Reader Support**
   - ARIA labels
   - Role attributes
   - Focus management
   - Announce collapse state changes

## Next Steps

1. Create basic component structure
2. Implement core navigation functionality
3. Add block uncollapse functionality
4. Add visual styling and animations
5. Integrate with existing course page
6. Add search functionality
7. Test and optimize performance
8. Add accessibility features 