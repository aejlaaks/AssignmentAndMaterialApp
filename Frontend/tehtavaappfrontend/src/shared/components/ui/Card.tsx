import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  bordered?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hoverable = false,
  bordered = true,
  shadow = 'sm',
  padding = 'md',
}) => {
  const cardClasses = [
    'card',
    hoverable ? 'card-hoverable' : '',
    bordered ? 'card-bordered' : '',
    `card-shadow-${shadow}`,
    `card-padding-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card; 