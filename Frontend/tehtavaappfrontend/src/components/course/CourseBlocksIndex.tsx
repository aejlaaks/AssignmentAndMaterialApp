import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, TextField, styled, Typography, useTheme, useMediaQuery } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { Block } from '../../types/block';
import BlockTypeIcon from './BlockTypeIcon';
import BlockStatusIndicator from './BlockStatusIndicator';
import { useDebounce } from '../../hooks/useDebounce';
import { useResponsive } from '../../hooks/useResponsive';

// Styled components
const IndexPanel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  position: 'fixed',
  right: isOpen ? 0 : '-250px',
  top: 0,
  width: '250px',
  height: '100vh',
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e0e0e0',
  transition: 'right 0.3s ease',
  zIndex: theme.zIndex.drawer,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    right: isOpen ? 0 : '-100%',
  },
}));

const IndexHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: '#fafafa',
}));

const IndexContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
});

const BlockList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const BlockHeaderItem = styled(Box, {
  shouldForwardProp: (prop) => !['isCurrent', 'isCollapsed'].includes(prop as string),
})<{ isCurrent?: boolean; isCollapsed?: boolean }>(({ theme, isCurrent, isCollapsed }) => ({
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  backgroundColor: isCurrent ? '#e3f2fd' : 'transparent',
  borderLeft: isCurrent ? '3px solid #2196f3' : 'none',
  opacity: isCollapsed ? 0.7 : 1,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  '&:focus': {
    outline: 'none',
    backgroundColor: '#f5f5f5',
  },
}));

const SearchWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  '& .MuiInputBase-root': {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
}));

const SearchIconWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing(1),
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#757575',
  pointerEvents: 'none',
}));

const ClearButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: '50%',
  transform: 'translateY(-50%)',
  padding: theme.spacing(0.5),
  color: '#757575',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

const NoResultsMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: '#757575',
}));

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isMobile: isMobileDevice } = useResponsive();
  
  const [isOpen, setIsOpen] = useState(!isMobileDevice);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleBlockClick = (blockId: string) => {
    onBlockSelect(blockId);
    onBlockUncollapse(blockId);
    if (isMobileDevice) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(blocks.length - 1, prev + 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (blocks[selectedIndex]) {
          handleBlockClick(blocks[selectedIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, blocks, selectedIndex, handleBlockClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Filter blocks based on search query
  const filteredBlocks = blocks.filter(block =>
    block.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <IndexPanel isOpen={isOpen}>
      <IndexHeader>
        {isMobileDevice && (
          <IconButton onClick={() => setIsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        )}
        {!isMobileDevice && (
          <IconButton onClick={() => setIsOpen(!isOpen)} size="small">
            {isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
        <SearchWrapper>
          <SearchIconWrapper>
            <SearchIcon fontSize="small" />
          </SearchIconWrapper>
          <TextField
            size="small"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          {searchQuery && (
            <ClearButton
              size="small"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <CloseIcon fontSize="small" />
            </ClearButton>
          )}
        </SearchWrapper>
      </IndexHeader>
      
      <IndexContent>
        <BlockList>
          {filteredBlocks.length > 0 ? (
            filteredBlocks.map((block, index) => (
              <BlockHeaderItem
                key={block.id}
                isCurrent={block.id === currentBlockId}
                isCollapsed={block.isCollapsed}
                onClick={() => {
                  setSelectedIndex(index);
                  handleBlockClick(block.id);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${block.title}${block.isCollapsed ? ' (collapsed)' : ''}`}
                sx={{
                  backgroundColor: index === selectedIndex ? '#f5f5f5' : undefined,
                }}
              >
                <BlockTypeIcon type={block.type} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {block.title}
                </Typography>
                <BlockStatusIndicator block={block} />
                {block.isCollapsed && (
                  <Box sx={{ color: '#757575', fontSize: '16px', ml: 1 }}>▼</Box>
                )}
              </BlockHeaderItem>
            ))
          ) : (
            <NoResultsMessage>
              <Typography variant="body2">
                No blocks found matching "{searchQuery}"
              </Typography>
            </NoResultsMessage>
          )}
        </BlockList>
      </IndexContent>
    </IndexPanel>
  );
};

export default CourseBlocksIndex; 