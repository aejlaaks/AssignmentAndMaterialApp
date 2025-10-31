import React from 'react';
import './Alert.css';

export interface AlertProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  title,
  variant = 'info',
  icon,
  onClose,
  className = '',
}) => {
  const alertClasses = [
    'alert',
    `alert-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={alertClasses} role="alert">
      <div className="alert-content">
        {icon && <div className="alert-icon">{icon}</div>}
        <div className="alert-message">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-description">{children}</div>
        </div>
      </div>
      {onClose && (
        <button 
          type="button" 
          className="alert-close-button" 
          onClick={onClose}
          aria-label="Close alert"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert; 