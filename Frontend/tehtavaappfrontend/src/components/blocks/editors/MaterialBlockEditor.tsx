import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Divider
} from '@mui/material';
import { MaterialBlock } from '../../../types/blocks';
import { BlockEditorProps } from './BlockEditorProps';
import { materialService } from '../../../services/materials/materialService';
import { IMaterial } from '../../../services/materials/materialTypes';
import MaterialUpload from '../../materials/MaterialUpload';

/**
 * Editor component for material blocks
 */
export const MaterialBlockEditor: React.FC<BlockEditorProps<MaterialBlock>> = ({
  block,
  courseId,
  onChange,
  onValidityChange
}) => {
  // State variables
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(block?.materialId || '');
  const [availableMaterials, setAvailableMaterials] = useState<IMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState<boolean>(false);
  
  // Update validity when fields change
  useEffect(() => {
    if (onValidityChange) {
      // Material blocks are valid when they have a selected material
      const isValid = !!selectedMaterialId;
      onValidityChange(isValid);
    }
    
    // Notify parent component about changes
    if (onChange) {
      onChange({ materialId: selectedMaterialId });
    }
  }, [selectedMaterialId, onChange, onValidityChange]);

  // Fetch materials when component mounts
  useEffect(() => {
    fetchMaterials();
  }, [courseId]);

  // Fetch available materials
  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);
      let materials: IMaterial[] = [];
      
      if (courseId) {
        // If course ID is provided, fetch materials for the course
        const courseMaterials = await materialService.getMaterialsByCourse(courseId);
        materials = courseMaterials as IMaterial[];
      } else {
        // Otherwise, fetch all materials
        const allMaterials = await materialService.getAllMaterials();
        materials = allMaterials as IMaterial[];
      }
      
      setAvailableMaterials(materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setAvailableMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Handle material upload success
  const handleMaterialUploadSuccess = (response: { id: string; fileUrl: string; title?: string }) => {
    console.log('Material upload success:', response);
    setSelectedMaterialId(response.id);
    fetchMaterials();
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="material-select-label">Material</InputLabel>
        <Select
          labelId="material-select-label"
          id="material-select"
          value={selectedMaterialId}
          label="Material"
          onChange={(e) => setSelectedMaterialId(e.target.value)}
          disabled={loadingMaterials}
        >
          {loadingMaterials ? (
            <MenuItem value="" disabled>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading materials...
              </Box>
            </MenuItem>
          ) : availableMaterials.length === 0 ? (
            <MenuItem value="" disabled>
              No materials available - upload one below
            </MenuItem>
          ) : (
            availableMaterials.map((material) => (
              <MenuItem key={material.id} value={material.id}>
                {material.title} ({material.fileType || 'unknown'})
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      
      {selectedMaterialId && availableMaterials.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Selected Material:</Typography>
          {availableMaterials
            .filter(m => m.id === selectedMaterialId)
            .map(material => (
              <Box key={material.id} sx={{ mt: 1 }}>
                <Typography variant="body1">{material.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {material.description || 'No description'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {material.fileType || 'N/A'}
                </Typography>
              </Box>
            ))
          }
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Upload New Material
      </Typography>
      
      <MaterialUpload
        courseId={courseId}
        onUploadSuccess={handleMaterialUploadSuccess}
      />
      
      {!courseId && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Materials uploaded here will be available to all courses.
          For course-specific materials, edit this block from within a course.
        </Alert>
      )}
    </Box>
  );
};