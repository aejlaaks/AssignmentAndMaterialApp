import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  TextFieldProps,
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

interface TextInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}

/**
 * Reusable text input component
 */
export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  helperText,
  error,
  fullWidth = true,
  ...rest
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      helperText={helperText}
      error={error}
      fullWidth={fullWidth}
      variant="outlined"
      margin="normal"
      {...rest}
    />
  );
};

interface TextAreaProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  rows?: number;
}

/**
 * Reusable textarea component
 */
export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  required = false,
  helperText,
  error,
  rows = 4,
  fullWidth = true,
  ...rest
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      helperText={helperText}
      error={error}
      fullWidth={fullWidth}
      variant="outlined"
      margin="normal"
      multiline
      rows={rows}
      {...rest}
    />
  );
};

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
}

/**
 * Reusable select input component
 */
export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  helperText,
  error,
  fullWidth = true
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const labelId = `${label.toLowerCase().replace(/\s+/g, '-')}-label`;

  return (
    <FormControl 
      fullWidth={fullWidth} 
      required={required} 
      error={error}
      margin="normal"
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        value={value}
        label={label}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

interface ToggleInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Reusable toggle/switch component
 */
export const ToggleInput: React.FC<ToggleInputProps> = ({
  label,
  checked,
  onChange
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          color="primary"
        />
      }
      label={label}
    />
  );
};

interface DateInputProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disablePast?: boolean;
}

/**
 * Reusable date picker component
 */
export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  error,
  required = false,
  disablePast = false
}) => {
  const handleDateChange = (date: Dayjs | null) => {
    onChange(date ? date.format('YYYY-MM-DD') : null);
  };

  return (
    <FormControl fullWidth margin="normal" error={error} required={required}>
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={handleDateChange}
        disablePast={disablePast}
        slotProps={{
          textField: {
            helperText: helperText,
            error: error,
            required: required,
            fullWidth: true
          }
        }}
      />
    </FormControl>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Section component for grouping form fields
 */
export const FormSection: React.FC<SectionProps> = ({
  title,
  children
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        {title}
      </Typography>
      <Box sx={{ pl: 1 }}>
        {children}
      </Box>
    </Box>
  );
}; 