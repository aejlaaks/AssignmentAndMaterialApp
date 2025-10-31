import React, { forwardRef } from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  containerClassName?: string;
  rows?: number;
  maxRows?: number;
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      variant = 'outlined',
      className = '',
      containerClassName = '',
      rows = 3,
      maxRows,
      autoResize = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }

      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        
        let newHeight = textarea.scrollHeight;
        if (maxRows) {
          const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
          const maxHeight = lineHeight * maxRows;
          newHeight = Math.min(newHeight, maxHeight);
        }
        
        textarea.style.height = `${newHeight}px`;
      }
    };

    const textareaClasses = [
      'textarea',
      `textarea-${variant}`,
      error ? 'textarea-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'textarea-container',
      fullWidth ? 'textarea-full-width' : '',
      containerClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className="textarea-label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          className={textareaClasses}
          rows={rows}
          onChange={handleChange}
          {...props}
        />
        {(error || helperText) && (
          <div className={`textarea-helper-text ${error ? 'textarea-error-text' : ''}`}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 