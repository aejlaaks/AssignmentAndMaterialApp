import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MaterialList from '../../materials/MaterialList';
import { useCourseMaterials } from '../../../hooks/useCourseMaterials';
import { Material } from '../../../interfaces/models/Material';

interface MaterialsTabContentProps {
  courseId: string;
  canManage: boolean;
  onAddMaterial?: () => void;
}

/**
 * Materials Tab Content Component
 * 
 * This component is responsible for displaying the materials tab in the course detail page.
 * It follows the Single Responsibility Principle by focusing only on material-related operations.
 */
const MaterialsTabContent: React.FC<MaterialsTabContentProps> = ({
  courseId,
  canManage,
  onAddMaterial
}) => {
  // State for notification messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Use our specialized hook for materials management
  const { 
    materials, 
    loading, 
    error,
    fetchMaterials,
    deleteMaterial 
  } = useCourseMaterials(courseId);
  
  // Handler for showing notifications
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handler for deleting materials
  const handleDeleteMaterial = async (materialId: string) => {
    const result = await deleteMaterial(materialId);
    showNotification(
      result.success ? 'Material deleted successfully' : 'Failed to delete material',
      result.success ? 'success' : 'error'
    );
  };

  // Handler for refreshing materials
  const handleRefresh = () => {
    fetchMaterials();
    showNotification('Materials refreshed', 'success');
  };

  // Render loading state
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" align="center">Loading materials...</Typography>
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="error" align="center">{error}</Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleRefresh}>
            Try Again
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      {/* Action buttons */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
        >
          Refresh Materials
        </Button>
        
        {canManage && onAddMaterial && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddMaterial}
          >
            Add Material
          </Button>
        )}
      </Box>

      {/* Materials list */}
      <MaterialList
        materials={materials}
        onDelete={canManage ? handleDeleteMaterial : undefined}
        canManage={canManage}
      />

      {/* Notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MaterialsTabContent; 