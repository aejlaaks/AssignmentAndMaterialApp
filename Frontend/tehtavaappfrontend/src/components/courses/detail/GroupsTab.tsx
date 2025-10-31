import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { SchoolGroup } from '../../../types';

interface GroupsTabProps {
  groups: SchoolGroup[];
  canManage: boolean;
  onAddGroup: () => void;
  onShowStudents: (group: SchoolGroup) => void;
  onEditGroup?: (e: React.MouseEvent, group: SchoolGroup) => void;
  onDeleteGroup?: (e: React.MouseEvent, group: SchoolGroup) => void;
}

const GroupsTab: React.FC<GroupsTabProps> = ({
  groups,
  canManage,
  onAddGroup,
  onShowStudents,
  onEditGroup,
  onDeleteGroup
}) => {
  // Helper function to count enrolled students
  const countEnrolledStudents = (group: SchoolGroup): number => {
    try {
      if (group.students && Array.isArray(group.students)) {
        return group.students.filter(student => student.enrolledToCourse === true).length;
      }
      return 0;
    } catch (error) {
      console.error('Virhe laskettaessa kurssille ilmoittautuneita opiskelijoita:', error);
      return 0;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Ryhmät</Typography>
        {canManage && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddGroup}
          >
            Lisää ryhmä
          </Button>
        )}
      </Box>
      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} md={4} key={group.id}>
            <Card 
              sx={{ cursor: 'pointer' }} 
              onClick={() => onShowStudents(group)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {group.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {canManage && onEditGroup && (
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={(e) => onEditGroup(e, group)}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    
                    {canManage && onDeleteGroup && (
                      <IconButton 
                        color="error" 
                        size="small"
                        onClick={(e) => onDeleteGroup(e, group)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Typography color="text.secondary">
                  {group.description || 'Ei kuvausta'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1, gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {countEnrolledStudents(group)} ilmoittautunut kurssille
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {group.students?.length || 0} opiskelijaa ryhmässä
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GroupsTab; 