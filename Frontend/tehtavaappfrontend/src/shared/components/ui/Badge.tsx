import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  icon,
  className = '',
}) => {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    rounded ? 'badge-rounded' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-text">{children}</span>
    </span>
  );
};

export default Badge; 