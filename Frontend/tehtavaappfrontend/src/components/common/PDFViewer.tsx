import React, { useEffect, useState } from 'react';
import { materialService } from '../../services/materials/materialService';
import { Box, CircularProgress, Typography, Paper, Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

interface PDFViewerProps {
  materialId: string;
  title?: string;
  onDownload?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ materialId, title, onDownload }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        const pdfBlob = await materialService.getMaterialContent(materialId);
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching PDF:', err);
        setError('Failed to load PDF. Please try again later.');
        setLoading(false);
      }
    };

    fetchPDF();

    // Clean up the object URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [materialId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!pdfUrl) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>No PDF available</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title || 'PDF Document'}</Typography>
        {onDownload && (
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={onDownload}
          >
            Download
          </Button>
        )}
      </Box>
      <Box 
        component="iframe" 
        src={pdfUrl} 
        width="100%" 
        height="600px" 
        sx={{ border: 'none' }} 
        title={title || 'PDF Viewer'}
      />
    </Paper>
  );
};

export default PDFViewer;
