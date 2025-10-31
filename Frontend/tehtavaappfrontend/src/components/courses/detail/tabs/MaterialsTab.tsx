import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Description } from '@mui/icons-material';
import { materialService } from '../../../../services/materials/materialService';
import { Material } from '../../../../interfaces/models/Material';
import MaterialList from '../../../materials/MaterialList';

interface MaterialsTabProps {
  courseId: string;
  isOwner: boolean;
}

/**
 * Component to display and manage course materials
 * 
 * Uses the existing MaterialList component to display materials and
 * follows the same pattern as the current implementation
 */
const MaterialsTab: React.FC<MaterialsTabProps> = ({ courseId, isOwner }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  /**
   * Map service material data to our Material type
   * Ensuring compatibility with the MaterialList component
   */
  const mapToMaterialType = (materialData: any): any => {
    return {
      id: materialData.id,
      title: materialData.title || '',
      description: materialData.description || materialData.content || '', // Never undefined
      content: materialData.content || '',
      fileUrl: materialData.fileUrl,
      fileType: materialData.fileType,
      fileName: materialData.fileName,
      courseId: materialData.courseId,
      createdById: materialData.createdById || materialData.createdBy || '',
      createdByName: materialData.createdByName || '',
      createdAt: typeof materialData.createdAt === 'string' ? materialData.createdAt : new Date().toISOString(),
      updatedAt: typeof materialData.updatedAt === 'string' ? materialData.updatedAt : undefined
    };
  };

  // Fetch materials when component mounts or refresh is triggered
  const fetchMaterials = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setRefreshing(true);
      console.log(`Fetching materials for course ${courseId}, forceRefresh=${forceRefresh}`);
      
      // Force refresh the cache if requested
      const result = await materialService.getMaterials(courseId, forceRefresh);
      console.log(`Got ${result.length} materials from API for course ${courseId}`);
      
      const mappedMaterials = result.map(mapToMaterialType);
      setMaterials(mappedMaterials);
      setDebugInfo(`Found ${result.length} materials (${new Date().toLocaleTimeString()})`);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setDebugInfo(`Error: ${error}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    // Always force refresh on initial load to avoid stale cache
    fetchMaterials(true);
  }, [courseId]);

  // Handle material deletion
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialService.deleteMaterial(materialId);
      // Refresh materials list after deletion
      fetchMaterials(true);
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  // Handle adding a material
  const handleAddMaterial = () => {
    // This would be connected to a dialog for adding materials
    console.log('Add material clicked');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMaterials(true); // Force refresh from API
  };

  if (loading && materials.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Course Materials</Typography>
        <Box>
          <Tooltip title="Refresh materials">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          {isOwner && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMaterial}
            >
              Add Material
            </Button>
          )}
        </Box>
      </Box>
      
      {debugInfo && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
          {debugInfo}
        </Typography>
      )}
      
      {materials && materials.length > 0 ? (
        <MaterialList 
          materials={materials} 
          onDelete={handleDeleteMaterial}
          canManage={isOwner}
        />
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No materials available for this course. {isOwner && 'Click "Add Material" to add materials.'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MaterialsTab; 