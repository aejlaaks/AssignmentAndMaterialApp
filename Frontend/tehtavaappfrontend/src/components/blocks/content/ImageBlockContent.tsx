import React from 'react';
import { Box, Typography } from '@mui/material';
import { ImageBlock } from '../../../types/blocks';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';

interface ImageBlockContentProps {
  block: ImageBlock;
  showTitle?: boolean;
}

export const ImageBlockContent: React.FC<ImageBlockContentProps> = ({ 
  block,
  showTitle = false
}) => {
  // Jos meillä on materialId, käytä ImageWithFallback-komponenttia
  if (block.materialId) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        {/* Remove title display since it's already shown in the header */}
        {/* {showTitle && block.title && (
          <Typography variant="h6" gutterBottom>
            {block.title}
          </Typography>
        )} */}
        <ImageWithFallback
          materialId={block.materialId}
          title={block.title}
        />
      </Box>
    );
  }
  
  // Jos meillä on suora URL, käytä sitä
  if (block.content?.startsWith('http')) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        {/* Remove title display since it's already shown in the header */}
        {/* {showTitle && block.title && (
          <Typography variant="h6" gutterBottom>
            {block.title}
          </Typography>
        )} */}
        <img 
          src={block.content} 
          alt={block.title || 'Image'} 
          style={{ 
            maxWidth: '100%',
            maxHeight: 400,
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }} 
          onError={(e) => {
            console.error('Error loading external image:', block.content);
            const target = e.currentTarget;
            target.style.display = 'none';
            
            const errorContainer = document.createElement('div');
            errorContainer.style.padding = '16px';
            errorContainer.style.border = '1px solid #ffcccc';
            errorContainer.style.borderRadius = '4px';
            errorContainer.style.marginTop = '8px';
            
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Kuvan lataaminen epäonnistui';
            errorMessage.style.color = '#d32f2f';
            errorMessage.style.fontWeight = 'bold';
            errorMessage.style.marginBottom = '8px';
            
            const errorDetails = document.createElement('div');
            errorDetails.textContent = `URL: ${block.content}`;
            errorDetails.style.color = '#666';
            errorDetails.style.fontSize = '0.875rem';
            
            errorContainer.appendChild(errorMessage);
            errorContainer.appendChild(errorDetails);
            
            target.parentNode?.appendChild(errorContainer);
          }}
        />
      </Box>
    );
  }
  
  // Fallback - näytä virheviesti
  return (
    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #ffcccc', borderRadius: 1, bgcolor: '#fff5f5' }}>
      {/* Remove title display since it's already shown in the header */}
      {/* {showTitle && block.title && (
        <Typography variant="h6" gutterBottom>
          {block.title}
        </Typography>
      )} */}
      <Typography variant="subtitle1" color="error" gutterBottom fontWeight="medium">
        Kuvaa ei voitu näyttää
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Kuva on saatettu poistaa tai siirtää.
        {block.content && (
          <Box component="span" display="block" mt={1} fontSize="0.875rem">
            Polku: {block.content}
          </Box>
        )}
      </Typography>
    </Box>
  );
}; 