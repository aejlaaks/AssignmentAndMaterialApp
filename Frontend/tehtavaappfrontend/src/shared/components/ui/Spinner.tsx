import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  fullPage?: boolean;
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  fullPage = false,
  label,
}) => {
  const spinnerClasses = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className,
  ].filter(Boolean).join(' ');

  const spinner = (
    <div className={spinnerClasses} role="status">
      <div className="spinner-circle"></div>
      {label && <span className="spinner-label">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="spinner-fullpage-container">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner; 