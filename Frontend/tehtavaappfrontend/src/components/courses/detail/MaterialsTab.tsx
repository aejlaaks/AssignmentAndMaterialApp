import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { IMaterial } from '../../../services/materials/materialTypes';
import MaterialList from '../../../components/materials/MaterialList';

interface MaterialsTabProps {
  materials: IMaterial[];
  canManage: boolean;
  onAddMaterial: () => void;
  onDeleteMaterial: (materialId: string) => void;
  onRefresh: () => void;
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({
  materials,
  canManage,
  onAddMaterial,
  onDeleteMaterial,
  onRefresh
}) => {
  console.log('MaterialsTab rendered with materials:', materials);
  console.log('Material count:', materials?.length || 0);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Kurssimateriaalit</Typography>
        <Box>
          <Tooltip title="Päivitä materiaalit">
            <IconButton onClick={onRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canManage && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddMaterial}
            >
              Lisää materiaali
            </Button>
          )}
        </Box>
      </Box>
      {materials && materials.length > 0 ? (
        <MaterialList 
          materials={materials} 
          onDelete={onDeleteMaterial}
          canManage={canManage}
        />
      ) : (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          No materials available for this course. {canManage && 'Click "Lisää materiaali" to add materials.'}
        </Typography>
      )}
    </Box>
  );
};

export default MaterialsTab; 