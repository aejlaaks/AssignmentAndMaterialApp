import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  IconButton, 
  Chip 
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  DragIndicator as DragIcon 
} from '@mui/icons-material';
import { RubricCriterion } from '../../../types/rubric';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

interface RubricCriterionItemProps {
  criterion: RubricCriterion;
  onUpdate: (updatedCriterion: RubricCriterion) => void;
  onDelete: (criterionId: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isReadOnly?: boolean;
}

export const RubricCriterionItem: React.FC<RubricCriterionItemProps> = ({
  criterion,
  onUpdate,
  onDelete,
  dragHandleProps = null,
  isReadOnly = false,
}) => {
  const handleEdit = () => {
    // Create a copy of the criterion for editing
    onUpdate({ ...criterion });
  };

  const handleDelete = () => {
    onDelete(criterion.id);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ overflow: 'hidden' }}
      data-criterion-id={criterion.id}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        {/* Always render a drag handle div but only apply the dragHandleProps when active */}
        <div
          {...((!isReadOnly && dragHandleProps) ? dragHandleProps : {})} 
          style={{ 
            marginRight: '16px', 
            display: 'flex', 
            alignItems: 'center',
            cursor: !isReadOnly && dragHandleProps ? 'grab' : 'default',
            opacity: !isReadOnly && dragHandleProps ? 1 : 0.5
          }}
        >
          <DragIcon color="action" />
        </div>
        
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle1" component="h3">
              {criterion.title}
            </Typography>
            <Chip
              label={`Weight: ${criterion.weight}×`}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
          {criterion.description && (
            <Typography variant="body2" color="text.secondary">
              {criterion.description}
            </Typography>
          )}
        </Box>
        
        {!isReadOnly && (
          <Box>
            <IconButton
              size="small"
              onClick={handleEdit}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2 }}>
        {/* Render levels or other criterion content here */}
        <Typography variant="body2" color="text.secondary">
          {criterion.levels?.length || 0} assessment levels defined
        </Typography>
      </Box>
    </Paper>
  );
}; 