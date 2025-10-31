import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AssignmentsTab } from '../detail/AssignmentsTab';
import { useCoursePermissions } from '../../../hooks/useCoursePermissions';
import { Assignment } from '../../../types';

/**
 * Container component for Assignments tab.
 * Follows the Single Responsibility Principle by managing only assignments tab state and logic.
 * Separates container logic from presentation (AssignmentsTab).
 */
interface AssignmentsTabContainerProps {
  courseId: string;
  courseTeacherId?: string;
  assignments: Assignment[];
  loading?: boolean;
  onAddAssignment?: () => void;
  onDeleteAssignment?: (id: string) => void;
}

export const AssignmentsTabContainer: React.FC<AssignmentsTabContainerProps> = ({
  courseId,
  courseTeacherId,
  assignments,
  loading = false,
  onAddAssignment,
  onDeleteAssignment
}) => {
  const { canManageCourse } = useCoursePermissions(courseTeacherId, courseId);

  if (loading && assignments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Action buttons */}
      {canManageCourse && onAddAssignment && (
        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddAssignment}
          >
            Lisää tehtävä
          </Button>
        </Box>
      )}

      {/* Assignments tab component */}
      <AssignmentsTab
        assignments={assignments}
        canManage={canManageCourse}
        onAddAssignment={onAddAssignment}
        onDeleteAssignment={onDeleteAssignment}
      />
    </Box>
  );
};

