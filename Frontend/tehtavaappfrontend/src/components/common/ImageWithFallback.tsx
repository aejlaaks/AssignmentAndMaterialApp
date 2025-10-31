import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { materialService } from '../../services/materials/materialService';
import { API_URL } from '../../utils/apiConfig';

interface ImageWithFallbackProps {
  materialId: string;
  title?: string;
  maxHeight?: number;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  materialId, 
  title,
  maxHeight = 400 
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const material = await materialService.getMaterialById(materialId);
        if (material && material.fileUrl) {
          const fullUrl = material.fileUrl.startsWith('http') 
            ? material.fileUrl 
            : `${API_URL}${material.fileUrl}`;
          setImageUrl(fullUrl);
        } else {
          setError('Kuvan tietoja ei löytynyt');
        }
      } catch (err) {
        console.error('Error fetching image:', err);
        setError('Kuvan lataaminen epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    fetchImageUrl();
  }, [materialId]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: 200 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !imageUrl) {
    return (
      <Box sx={{ 
        p: 2, 
        border: '1px solid #ffcccc', 
        borderRadius: 1, 
        bgcolor: '#fff5f5',
        textAlign: 'center' 
      }}>
        <Typography variant="subtitle1" color="error" gutterBottom fontWeight="medium">
          {error || 'Kuvaa ei voitu näyttää'}
        </Typography>
        {materialId && (
          <Typography variant="body2" color="text.secondary">
            Material ID: {materialId}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title || 'Kuva'}
      style={{
        maxWidth: '100%',
        maxHeight,
        width: 'auto',
        height: 'auto',
        objectFit: 'contain'
      }}
      onError={(e) => {
        console.error('Error loading image:', imageUrl);
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
        errorDetails.textContent = `URL: ${imageUrl}`;
        errorDetails.style.color = '#666';
        errorDetails.style.fontSize = '0.875rem';
        
        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(errorDetails);
        
        target.parentNode?.appendChild(errorContainer);
      }}
    />
  );
}; 