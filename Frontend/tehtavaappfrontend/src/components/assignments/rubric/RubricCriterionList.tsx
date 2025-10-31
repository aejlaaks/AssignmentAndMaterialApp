import React, { memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { RubricCriterion } from '../../../types/rubric';
import RubricLevelList from '../../../components/assignments/rubric/RubricLevelList';
import { RubricCriterionItem } from './RubricCriterionItem';

// Override defaultProps to fix react-beautiful-dnd warning
// Use type assertion to avoid typescript errors
(Droppable as any).defaultProps = undefined;
(Draggable as any).defaultProps = undefined;

interface RubricCriterionListProps {
  criteria: RubricCriterion[];
  onEditCriterion: (index: number) => void;
  onDeleteCriterion: (index: number) => void;
  onAddLevel: (criterionIndex: number) => void;
  onEditLevel: (criterionIndex: number, levelIndex: number) => void;
  onDeleteLevel: (criterionIndex: number, levelIndex: number) => void;
  onReorderCriteria: (result: DropResult) => void;
  onMoveCriterion: (index: number, direction: 'up' | 'down') => void;
  onCriterionUpdate: (updatedCriterion: RubricCriterion) => void;
  onCriterionDelete: (criterionId: string) => void;
  isReadOnly?: boolean;
}

export const RubricCriterionList: React.FC<RubricCriterionListProps> = memo(({
  criteria,
  onEditCriterion,
  onDeleteCriterion,
  onAddLevel,
  onEditLevel,
  onDeleteLevel,
  onReorderCriteria,
  onMoveCriterion,
  onCriterionUpdate,
  onCriterionDelete,
  isReadOnly = false,
}) => {
  if (criteria.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          No criteria added yet. Add criteria to define how this assignment will be graded.
        </Typography>
      </Box>
    );
  }

  // Ensure all boolean properties are explicitly boolean
  const isDropDisabled = Boolean(isReadOnly);

  return (
    <Droppable droppableId="criteria-list">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          style={{ width: '100%', minHeight: '50px' }}
          data-testid="criteria-list"
        >
          {criteria.map((criterion, index) => (
            <DraggableCriterion
              key={criterion.id}
              criterion={criterion}
              index={index}
              onUpdate={onCriterionUpdate}
              onDelete={onCriterionDelete}
              isReadOnly={isReadOnly}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
});

// Separate DraggableCriterion component to improve stability
const DraggableCriterion = memo(({
  criterion,
  index,
  onUpdate,
  onDelete,
  isReadOnly
}: {
  criterion: RubricCriterion;
  index: number;
  onUpdate: (updatedCriterion: RubricCriterion) => void;
  onDelete: (criterionId: string) => void;
  isReadOnly: boolean;
}) => {
  return (
    <Draggable
      key={criterion.id}
      draggableId={criterion.id}
      index={index}
      isDragDisabled={isReadOnly}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ 
            ...provided.draggableProps.style,
            marginBottom: '16px'
          }}
          data-criterion-id={criterion.id}
        >
          <RubricCriterionItem
            criterion={criterion}
            onUpdate={onUpdate}
            onDelete={onDelete}
            dragHandleProps={provided.dragHandleProps}
            isReadOnly={isReadOnly}
          />
        </div>
      )}
    </Draggable>
  );
});

export default RubricCriterionList; 