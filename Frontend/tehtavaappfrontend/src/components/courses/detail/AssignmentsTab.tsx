import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Assignment } from '../../../types';

interface AssignmentsTabProps {
  assignments: Assignment[];
  canManage: boolean;
  onAddAssignment: () => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  assignments,
  canManage,
  onAddAssignment,
  onDeleteAssignment
}) => {
  const navigate = useNavigate();

  const handleDeleteAssignment = (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation();
    if (onDeleteAssignment) {
      onDeleteAssignment(assignmentId);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Tehtävät</Typography>
        {canManage && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddAssignment}
          >
            Lisää tehtävä
          </Button>
        )}
      </Box>
      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} md={4} key={assignment.id}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/assignments/${assignment.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {assignment.title}
                  </Typography>
                  {canManage && (
                    <Box>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/assignments/edit/${assignment.id}`);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={(e) => handleDeleteAssignment(e, assignment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {assignment.description && assignment.description.length > 100
                    ? `${assignment.description.substring(0, 100)}...`
                    : assignment.description || 'Ei kuvausta'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Chip 
                    size="small" 
                    label={`Palautus: ${new Date(assignment.dueDate).toLocaleDateString('fi-FI')}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssignmentsTab; 