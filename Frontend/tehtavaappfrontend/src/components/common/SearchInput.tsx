import { type FC, useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceTime?: number;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  autoFocus?: boolean;
  sx?: SxProps<Theme>;
}

export const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Hae...',
  debounceTime = 300,
  fullWidth = true,
  size = 'small',
  variant = 'outlined',
  autoFocus = false,
  sx,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debounce
  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceTime);
  };

  // Clear search input
  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Box sx={sx}>
      <TextField
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: inputValue ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="tyhjennä haku"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  );
};
