import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      variant = 'outlined',
      size = 'medium',
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const inputClasses = [
      'input',
      `input-${variant}`,
      `input-${size}`,
      error ? 'input-error' : '',
      leftIcon ? 'input-with-left-icon' : '',
      rightIcon ? 'input-with-right-icon' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'input-container',
      fullWidth ? 'input-full-width' : '',
      containerClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className="input-label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="input-wrapper">
          {leftIcon && <div className="input-icon input-icon-left">{leftIcon}</div>}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && <div className="input-icon input-icon-right">{rightIcon}</div>}
        </div>
        {(error || helperText) && (
          <div className={`input-helper-text ${error ? 'input-error-text' : ''}`}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 