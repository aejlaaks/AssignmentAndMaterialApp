import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  color = '#1976d2' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="20" width="80" height="60" rx="5" fill={color} />
      <rect x="20" y="30" width="60" height="10" rx="2" fill="white" />
      <rect x="20" y="45" width="60" height="10" rx="2" fill="white" />
      <rect x="20" y="60" width="40" height="10" rx="2" fill="white" />
      <circle cx="75" cy="65" r="10" fill="white" />
      <circle cx="75" cy="65" r="5" fill={color} />
    </svg>
  );
};

export default Logo; 