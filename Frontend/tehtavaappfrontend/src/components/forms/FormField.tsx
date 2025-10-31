import { type FC } from 'react';
import {
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  type TextFieldProps,
  type SelectProps,
  type CheckboxProps,
  type SxProps,
  type Theme,
} from '@mui/material';

type BaseFieldProps = {
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  sx?: SxProps<Theme>;
};

type TextInputProps = BaseFieldProps & {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number | undefined;
  onChange: TextFieldProps['onChange'];
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  inputProps?: TextFieldProps['inputProps'];
};

type SelectInputProps = BaseFieldProps & {
  type: 'select';
  value: string | number | undefined;
  onChange: SelectProps['onChange'];
  label: string;
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
};

type CheckboxInputProps = BaseFieldProps & {
  type: 'checkbox';
  checked: boolean;
  onChange: CheckboxProps['onChange'];
  label: string;
};

type FormFieldProps = TextInputProps | SelectInputProps | CheckboxInputProps;

export const FormField: FC<FormFieldProps> = (props) => {
  const {
    error,
    helperText,
    fullWidth = true,
    required = false,
    disabled = false,
    margin = 'normal',
    sx,
  } = props;

  if (props.type === 'checkbox') {
    return (
      <FormControl
        error={!!error}
        required={required}
        disabled={disabled}
        margin={margin}
        sx={sx}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={props.checked}
              onChange={props.onChange}
              color="primary"
            />
          }
          label={props.label}
        />
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  if (props.type === 'select') {
    return (
      <FormControl
        error={!!error}
        fullWidth={fullWidth}
        required={required}
        disabled={disabled}
        margin={margin}
        sx={sx}
      >
        <InputLabel>{props.label}</InputLabel>
        <Select
          value={props.value ?? ''}
          onChange={props.onChange}
          label={props.label}
          displayEmpty={!!props.placeholder}
        >
          {props.placeholder && (
            <MenuItem value="" disabled>
              {props.placeholder}
            </MenuItem>
          )}
          {props.options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {(error || helperText) && (
          <FormHelperText>{error || helperText}</FormHelperText>
        )}
      </FormControl>
    );
  }

  return (
    <TextField
      type={props.type}
      value={props.value ?? ''}
      onChange={props.onChange}
      label={props.label}
      placeholder={props.placeholder}
      error={!!error}
      helperText={error || helperText}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      margin={margin}
      multiline={props.multiline}
      rows={props.rows}
      maxRows={props.maxRows}
      autoFocus={props.autoFocus}
      autoComplete={props.autoComplete}
      inputProps={props.inputProps}
      sx={sx}
    />
  );
};
