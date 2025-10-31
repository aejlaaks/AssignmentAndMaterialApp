import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Typography, 
  Paper, 
  Divider,
  Box,
  Collapse,
  Tooltip
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Material } from '../../interfaces/models/Material';
import { useMaterialService } from '../../contexts/ServiceContext';
import PDFViewer from '../common/PDFViewer';

/**
 * MaterialList Props
 * Following Interface Segregation Principle with focused props
 */
interface MaterialListProps {
  materials: Material[];
  onDelete?: (id: string) => void;
  isTeacher?: boolean;
  canManage?: boolean;
}

/**
 * Material List Component
 * 
 * Displays a list of materials with options to view, download, and delete.
 * Follows Single Responsibility Principle by focusing only on displaying materials.
 */
const MaterialList: React.FC<MaterialListProps> = ({ 
  materials, 
  onDelete,
  isTeacher = false,
  canManage = isTeacher
}) => {
  console.log('MaterialList: materials passed to component:', materials);
  console.log('MaterialList: materials count:', materials?.length || 0);

  // State
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  
  // Services
  const materialService = useMaterialService();

  // Event handlers
  const handleToggleExpand = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
  };

  const handleDownload = async (material: Material) => {
    try {
      await materialService.downloadMaterial(material.id, `${material.title}${getFileExtension(material)}`);
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  // Helper functions
  const getFileExtension = (material: Material): string => {
    if (materialService.isPDF(material)) return '.pdf';
    if (material.type === 'Markdown') return '.md';
    if (material.type === 'HTML') return '.html';
    if (material.type === 'Text') return '.txt';
    return '';
  };

  const getFileIcon = (material: Material) => {
    if (materialService.isPDF(material)) return <PdfIcon color="error" />;
    if (material.type === 'Image') return <ImageIcon color="primary" />;
    if (material.type === 'Video') return <VideoIcon color="secondary" />;
    if (material.type === 'Audio') return <AudioIcon color="success" />;
    if (material.type === 'Text') return <TextIcon color="info" />;
    if (material.type === 'Code') return <CodeIcon color="warning" />;
    return <DocumentIcon />;
  };

  // Render empty state
  if (!materials || materials.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No materials available
        </Typography>
      </Paper>
    );
  }

  // Main render
  return (
    <Paper elevation={2} sx={{ mb: 3 }}>
      <List>
        {materials.map((material, index) => (
          <React.Fragment key={material.id}>
            <ListItem
              button
              onClick={() => materialService.isPDF(material) && handleToggleExpand(material.id)}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Tooltip title="Lataa">
                    <IconButton
                      size="small"
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleDownload(material);
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canManage && onDelete && (
                    <Tooltip title="Poista">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(material.id);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemIcon>
                {getFileIcon(material)}
              </ListItemIcon>
              <ListItemText
                primary={material.title}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="textPrimary">
                      {material.type} • {new Date(material.createdAt.toString()).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {material.description}
                    </Typography>
                  </React.Fragment>
                }
              />
              {materialService.isPDF(material) && (
                expandedMaterial === material.id ? <ExpandLessIcon /> : <ExpandMoreIcon />
              )}
            </ListItem>
            
            {materialService.isPDF(material) && (
              <Collapse in={expandedMaterial === material.id} timeout="auto" unmountOnExit>
                <Box sx={{ px: 3, pb: 3 }}>
                  <PDFViewer 
                    materialId={material.id} 
                    title={material.title}
                    onDownload={() => handleDownload(material)}
                  />
                </Box>
              </Collapse>
            )}
            
            {index < materials.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default MaterialList;
