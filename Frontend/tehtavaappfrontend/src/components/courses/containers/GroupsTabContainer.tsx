import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { GroupsTab } from '../detail/GroupsTab';
import { useCoursePermissions } from '../../../hooks/useCoursePermissions';
import { SchoolGroup } from '../../../types';

/**
 * Container component for Groups tab.
 * Follows the Single Responsibility Principle by managing only groups tab state and logic.
 * Separates container logic from presentation (GroupsTab).
 */
interface GroupsTabContainerProps {
  courseId: string;
  courseTeacherId?: string;
  groups: SchoolGroup[];
  loading?: boolean;
  onAddGroup?: () => void;
  onEditGroup?: (group: SchoolGroup) => void;
  onDeleteGroup?: (id: string) => void;
  onManageStudents?: (group: SchoolGroup) => void;
}

export const GroupsTabContainer: React.FC<GroupsTabContainerProps> = ({
  courseId,
  courseTeacherId,
  groups,
  loading = false,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onManageStudents
}) => {
  const { canManageCourse } = useCoursePermissions(courseTeacherId, courseId);

  if (loading && groups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Action buttons */}
      {canManageCourse && onAddGroup && (
        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddGroup}
          >
            Lisää ryhmä
          </Button>
        </Box>
      )}

      {/* Groups tab component */}
      <GroupsTab
        groups={groups}
        canManage={canManageCourse}
        onAddGroup={onAddGroup}
        onEditGroup={onEditGroup}
        onDeleteGroup={onDeleteGroup}
        onManageStudents={onManageStudents}
      />
    </Box>
  );
};

