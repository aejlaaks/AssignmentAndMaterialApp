import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, Container } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon } from '@mui/icons-material';
import PDFViewer from '../components/common/PDFViewer';
import { materialService } from '../services/materials/materialService';

// Define Material interface directly to avoid import issues
interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  courseId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  accessCount?: number;
  type?: string;
}

// Helper functions for material type detection
const isPDF = (material: Material): boolean => {
  return material.fileType?.includes('pdf') || 
         material.fileName?.toLowerCase().endsWith('.pdf') || 
         false;
};

const isImage = (material: Material): boolean => {
  return material.fileType?.includes('image/') || 
         ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => 
           material.fileName?.toLowerCase().endsWith(`.${ext}`)
         ) || 
         false;
};

const MaterialView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Get material metadata
        const material = await materialService.getMaterialById(id);
        setMaterial(material as any); // Cast to any to bypass type mismatch temporarily
        
        // Get the actual content
        const content = await materialService.getMaterialContent(id);
        if (content) {
          const url = URL.createObjectURL(content);
          setContentUrl(url);
        }
      } catch (error) {
        console.error('Error fetching material:', error);
        setError('Material loading failed');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterial();
    
    return () => {
      // Clean up any blob URLs
      if (contentUrl) {
        URL.revokeObjectURL(contentUrl);
      }
    };
  }, [id]);
  
  // Determine if the material is a PDF or image
  const contentIsPDF = material ? isPDF(material) : false;
  const contentIsImage = material ? isImage(material) : false;

  const handleDownload = async () => {
    if (!material || !id) return;

    try {
      setLoading(true);
      const result = await materialService.downloadMaterial(id);
      
      if (result && result.blob) {
        // Create blob URL and trigger download
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || `${material.title}.${material.fileType?.split('/')[1] || 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading material:', error);
      setError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!material) return null;

    if (contentIsPDF) {
      return <PDFViewer materialId={material.id} title={material.title} onDownload={handleDownload} />;
    } else if (contentIsImage) {
      return (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <img 
            src={contentUrl || material.fileUrl} 
            alt={material.title} 
            style={{ maxWidth: '100%', maxHeight: '70vh' }} 
          />
        </Box>
      );
    } else {
      return (
        <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body1">
            This file type cannot be previewed directly. Please download to view.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownload}
            sx={{ mt: 2 }}
          >
            Download
          </Button>
        </Box>
      );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
          <Typography color="error" gutterBottom>{error}</Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Button 
              variant="text" 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate(-1)}
              sx={{ mb: 1 }}
            >
              Back
            </Button>
            <Typography variant="h4">{material?.title}</Typography>
            {material?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {material.description}
              </Typography>
            )}
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>
        
        {renderContent()}
        
        {material && (
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
            <Typography variant="caption" display="block" color="text.secondary">
              Type: {material.type || 'Document'} • 
              Added: {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : 'Unknown'} • 
              {material.courseId && `Course ID: ${material.courseId} • `}
              Views: {material.accessCount || 0}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MaterialView;
