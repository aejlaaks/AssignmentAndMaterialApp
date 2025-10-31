import React, { useState, useEffect } from 'react';
import { getFixedImageUrl } from '../../utils/imageUtils';

interface ProxyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

/**
 * A component that proxies image requests through our backend API when needed
 * This prevents 409 errors when accessing private blob storage
 */
const ProxyImage: React.FC<ProxyImageProps> = ({ 
  src, 
  fallbackSrc = '',
  alt = '',
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    if (src) {
      const fixedSrc = getFixedImageUrl(src);
      setImgSrc(fixedSrc);
      setError(false);
    }
  }, [src]);
  
  const handleError = () => {
    console.error(`Error loading image: ${imgSrc}`);
    setError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };
  
  if (!imgSrc) {
    return null;
  }
  
  return (
    <img
      src={error && fallbackSrc ? fallbackSrc : imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default ProxyImage; 