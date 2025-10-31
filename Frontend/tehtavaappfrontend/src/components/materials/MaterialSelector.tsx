import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon
} from '@mui/icons-material';
import { IMaterial, Material } from '../../services/materials/materialTypes';
import { materialService } from '../../services/materials/materialService';

interface MaterialSelectorProps {
  courseId: string;
  selectedMaterialIds: string[];
  onChange: (materialIds: string[]) => void;
  disabled?: boolean;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  courseId,
  selectedMaterialIds,
  onChange,
  disabled = false
}) => {
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely convert IMaterial to Material
  const toMaterial = (material: IMaterial): Material => {
    return {
      ...material,
      createdAt: typeof material.createdAt === 'string' ? material.createdAt : undefined,
      updatedAt: typeof material.updatedAt === 'string' ? material.updatedAt : undefined
    };
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const data = await materialService.getMaterials(courseId);
        const convertedMaterials: IMaterial[] = data.map(m => ({
          ...m,
          createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString()
        }));
        setMaterials(convertedMaterials);
        setError(null);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [courseId]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    // On autofill we get a stringified value.
    const materialIds = typeof value === 'string' ? value.split(',') : value;
    onChange(materialIds);
  };

  const getFileIcon = (material: IMaterial) => {
    // Use the helper function to convert IMaterial to Material
    if (materialService.isPDF(toMaterial(material))) return <PdfIcon color="error" />;
    if (material.type === 'Image') return <ImageIcon color="primary" />;
    if (material.type === 'Video') return <VideoIcon color="secondary" />;
    if (material.type === 'Audio') return <AudioIcon color="success" />;
    if (material.type === 'Text') return <TextIcon color="info" />;
    if (material.type === 'Code') return <CodeIcon color="warning" />;
    return <DocumentIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <Typography color="textSecondary" variant="body2">
        No materials available for this course. Please upload materials first.
      </Typography>
    );
  }

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id="material-selector-label">Related Materials</InputLabel>
      <Select
        labelId="material-selector-label"
        id="material-selector"
        multiple
        value={selectedMaterialIds}
        onChange={handleChange}
        input={<OutlinedInput label="Related Materials" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((materialId) => {
              const material = materials.find(m => m.id === materialId);
              return (
                <Chip 
                  key={materialId} 
                  label={material ? material.title : materialId} 
                  size="small"
                />
              );
            })}
          </Box>
        )}
      >
        {materials.map((material) => (
          <MenuItem key={material.id} value={material.id}>
            <Checkbox checked={selectedMaterialIds.indexOf(material.id) > -1} />
            <ListItemIcon>
              {getFileIcon(material)}
            </ListItemIcon>
            <ListItemText 
              primary={material.title}
              secondary={material.description}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MaterialSelector;
