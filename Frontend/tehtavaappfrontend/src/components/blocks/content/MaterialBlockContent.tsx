import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Chip, Collapse, IconButton, Alert } from '@mui/material';
import { 
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Article as ArticleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { MaterialBlock } from '../../../types/blocks';
import { materialService, Material } from '../../../services/materials/materialService';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import PDFViewer from '../../common/PDFViewer';

interface MaterialBlockContentProps {
  block: MaterialBlock;
  showTitle?: boolean;
}

export const MaterialBlockContent: React.FC<MaterialBlockContentProps> = ({ 
  block,
  showTitle = false
}) => {
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfExpanded, setPdfExpanded] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fetch material metadata
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        console.log(`Fetching material with ID: ${block.materialId}`);
        const data = await materialService.getMaterialById(block.materialId);
        console.log(`Material fetched successfully:`, data);
        setMaterial(data);
        
        // If it's a PDF, pre-fetch the content
        if (data && materialService.isPDF(data)) {
          fetchPdfContent(data.id);
        }
      } catch (err) {
        console.error('Error fetching material:', err);
        setError('Materiaalin lataaminen epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [block.materialId]);

  // Separate function to fetch PDF content
  const fetchPdfContent = async (materialId: string) => {
    try {
      setPdfLoading(true);
      setPdfError(null);
      console.log(`Fetching PDF content for material ID: ${materialId}`);
      const pdfBlob = await materialService.getMaterialContent(materialId);
      const url = URL.createObjectURL(pdfBlob);
      console.log(`PDF content fetched and URL created: ${url}`);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Error fetching PDF content:', err);
      
      // Handle specific HTTP error statuses
      if (err.response) {
        const status = err.response.status;
        if (status === 403) {
          setPdfError('Ei käyttöoikeuksia tähän materiaaliin. Ole yhteydessä opettajaan.');
        } else if (status === 404) {
          setPdfError('Materiaalia ei löytynyt.');
        } else {
          setPdfError(`PDF-tiedoston lataaminen epäonnistui (${status})`);
        }
      } else {
        setPdfError('PDF-tiedoston lataaminen epäonnistui');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        console.log(`Revoking object URL: ${pdfUrl}`);
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !material) {
    return (
      <Box sx={{ p: 2, border: '1px solid #ffcccc', borderRadius: 1, bgcolor: '#fff5f5', textAlign: 'center' }}>
        {showTitle && block.title && (
          <Typography variant="h6" gutterBottom>
            {block.title}
          </Typography>
        )}
        <Typography color="error">
          {error || 'Materiaalia ei löytynyt'}
        </Typography>
        {block.materialId && (
          <Typography variant="body2" color="text.secondary">
            Material ID: {block.materialId}
          </Typography>
        )}
      </Box>
    );
  }

  const getIcon = () => {
    if (materialService.isPDF(material)) return <PdfIcon />;
    if (materialService.isImage(material)) return <ImageIcon />;
    if (material.type === 'Video') return <VideoIcon />;
    if (material.type === 'Audio') return <AudioIcon />;
    return <ArticleIcon />;
  };

  const handleDownload = () => {
    if (material) {
      materialService.downloadMaterial(material.id, material.title);
    }
  };

  const togglePdfView = () => {
    setPdfExpanded(!pdfExpanded);
    
    // If expanding and we don't have the PDF content yet, fetch it
    if (!pdfExpanded && !pdfUrl && !pdfLoading && material) {
      fetchPdfContent(material.id);
    }
  };

  const renderPdfViewer = () => {
    if (pdfLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (pdfError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {pdfError}
        </Alert>
      );
    }

    if (!pdfUrl) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          PDF-tiedostoa ei voitu ladata. Kokeile ladata tiedosto.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
        <Box 
          component="iframe" 
          src={pdfUrl} 
          width="100%" 
          height="600px" 
          sx={{ 
            border: 'none',
            display: 'block' // Ensure iframe is displayed as block
          }} 
          title={material.title || 'PDF Viewer'}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2, color: 'primary.main' }}>{getIcon()}</Box>
      </Box>

      {material.description && (
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {material.description}
        </Typography>
      )}

      {materialService.isImage(material) && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <ImageWithFallback
            materialId={material.id}
            title={material.title}
          />
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {material.type && (
          <Chip 
            label={material.type} 
            size="small" 
            variant="outlined"
            icon={getIcon()}
          />
        )}
        {material.fileType && (
          <Chip 
            label={material.fileType} 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Lisätty: {new Date(material.createdAt || '').toLocaleDateString()}
        </Typography>
        
        {materialService.isPDF(material) ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={togglePdfView}
              startIcon={pdfExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {pdfExpanded ? 'Piilota PDF' : 'Näytä PDF'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              startIcon={<DescriptionIcon />}
            >
              Lataa PDF
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownload}
            startIcon={<DescriptionIcon />}
          >
            Lataa materiaali
          </Button>
        )}
      </Box>

      {materialService.isPDF(material) && (
        <Collapse in={pdfExpanded} timeout="auto" unmountOnExit>
          {renderPdfViewer()}
        </Collapse>
      )}
    </Box>
  );
}; 