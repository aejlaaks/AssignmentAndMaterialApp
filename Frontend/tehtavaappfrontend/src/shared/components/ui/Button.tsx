import React from 'react';
import './Button.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
  loading = false,
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const fullWidthClass = fullWidth ? 'btn-full-width' : '';
  const loadingClass = loading ? 'btn-loading' : '';
  
  const buttonClasses = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="btn-spinner" />}
      {!loading && icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
      <span className="btn-text">{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
    </button>
  );
};

export default Button; 