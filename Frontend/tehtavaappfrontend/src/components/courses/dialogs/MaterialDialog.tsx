import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  CircularProgress,
  Typography
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMaterial } from '../../../services/materials/materialTypes';
import { materialService } from '../../../services/materials/materialService';
import MaterialUpload from '../../materials/MaterialUpload';

interface MaterialDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreateMaterial: (materialId: string) => void;
  onAddExistingMaterials: (materialIds: string[]) => void;
}

const materialSchema = yup.object({
  title: yup.string().required('Otsikko on pakollinen'),
  content: yup.string().required('Sisältö on pakollinen'),
}).required();

const MaterialDialog: React.FC<MaterialDialogProps> = ({
  open,
  onClose,
  courseId,
  onCreateMaterial,
  onAddExistingMaterials
}) => {
  const [tabValue, setTabValue] = useState<'upload' | 'existing'>('upload');
  const [availableMaterials, setAvailableMaterials] = useState<IMaterial[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const materialForm = useForm({
    resolver: yupResolver(materialSchema)
  });

  useEffect(() => {
    if (tabValue === 'existing' && open) {
      fetchAllMaterials();
    }
  }, [tabValue, open]);

  const fetchAllMaterials = async () => {
    try {
      setLoading(true);
      const materials = await materialService.getAllMaterials();
      const convertedMaterials: IMaterial[] = materials.map(m => ({
        ...m,
        createdAt: m.createdAt || new Date().toISOString()
      }));
      setAvailableMaterials(convertedMaterials);
    } catch (error) {
      console.error('Virhe haettaessa materiaaleja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'upload' | 'existing') => {
    setTabValue(newValue);
  };

  const handleAddExistingMaterials = () => {
    onAddExistingMaterials(selectedMaterialIds);
    setSelectedMaterialIds([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedMaterialIds([]);
    materialForm.reset();
    onClose();
  };

  // Create a wrapper function for the material upload success callback
  const handleUploadSuccess = (response: { id: string; fileUrl: string; title?: string }) => {
    onCreateMaterial(response.id);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Lisää materiaali kurssille</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab value="upload" label="Lataa uusi" />
          <Tab value="existing" label="Käytä olemassa olevaa" />
        </Tabs>

        {tabValue === 'upload' && (
          <MaterialUpload 
            courseId={courseId}
            onUploadSuccess={handleUploadSuccess}
          />
        )}

        {tabValue === 'existing' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Valitse olemassa olevat materiaalit lisättäväksi tälle kurssille
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="material-select-label">Materiaalit</InputLabel>
                  <Select
                    labelId="material-select-label"
                    multiple
                    value={selectedMaterialIds}
                    onChange={(e) => setSelectedMaterialIds(e.target.value as string[])}
                    input={<OutlinedInput label="Materiaalit" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((materialId) => {
                          const material = availableMaterials.find(m => m.id === materialId);
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
                    {availableMaterials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        <Checkbox checked={selectedMaterialIds.indexOf(material.id) > -1} />
                        <ListItemText primary={material.title} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Peruuta</Button>
        {tabValue === 'existing' && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddExistingMaterials}
            disabled={selectedMaterialIds.length === 0}
          >
            Lisää valitut materiaalit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MaterialDialog; 