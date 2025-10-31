import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { MaterialsTab } from '../detail/MaterialsTab';
import { useCourseMaterials } from '../../../hooks/useCourseMaterials';
import { useCoursePermissions } from '../../../hooks/useCoursePermissions';

/**
 * Container component for Materials tab.
 * Follows the Single Responsibility Principle by managing only materials tab state and logic.
 * Separates container logic from presentation (MaterialsTab).
 */
interface MaterialsTabContainerProps {
  courseId: string;
  courseTeacherId?: string;
  onAddMaterial?: () => void;
}

export const MaterialsTabContainer: React.FC<MaterialsTabContainerProps> = ({
  courseId,
  courseTeacherId,
  onAddMaterial
}) => {
  const {
    materials,
    loading,
    error,
    fetchMaterials,
    refreshMaterials,
    deleteMaterial
  } = useCourseMaterials(courseId);

  const { canManageCourse } = useCoursePermissions(courseTeacherId, courseId);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch materials on mount
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMaterials();
    setIsRefreshing(false);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const result = await deleteMaterial(materialId);
    if (result.success) {
      // Optionally show success message
      console.log('Material deleted successfully');
    } else {
      // Optionally show error message
      console.error('Failed to delete material:', result.error);
    }
  };

  if (loading && materials.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Action buttons */}
      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Päivitetään...' : 'Päivitä'}
        </Button>
        {canManageCourse && onAddMaterial && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddMaterial}
          >
            Lisää materiaali
          </Button>
        )}
      </Box>

      {/* Materials tab component */}
      <MaterialsTab
        materials={materials}
        canManage={canManageCourse}
        onAddMaterial={onAddMaterial}
        onDeleteMaterial={handleDeleteMaterial}
        onRefresh={handleRefresh}
      />

      {error && (
        <Box color="error.main" mt={2}>
          {error}
        </Box>
      )}
    </Box>
  );
};

