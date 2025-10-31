import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { rubricService } from '../../services/assignments/rubricService';
import { Rubric, RubricCriterion, RubricLevel } from '../../types/rubric';
import {
  RubricCriterionForm,
  RubricLevelForm,
  RubricCriterionList
} from './rubric';

interface RubricEditorProps {
  assignmentId: string;
  initialRubric?: Rubric;
  onSave?: (rubric: Rubric) => void;
  onCancel?: () => void;
}

const RubricEditor: React.FC<RubricEditorProps> = ({
  assignmentId,
  initialRubric,
  onSave,
  onCancel
}) => {
  const defaultRubric: Rubric = {
    id: '',
    assignmentId,
    title: '',
    description: '',
    totalPoints: 0,
    criteria: []
  };

  const [rubric, setRubric] = useState<Rubric>(initialRubric || defaultRubric);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Dialog states
  const [criterionDialogOpen, setCriterionDialogOpen] = useState<boolean>(false);
  const [levelDialogOpen, setLevelDialogOpen] = useState<boolean>(false);
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null);
  const [editingLevel, setEditingLevel] = useState<RubricLevel | null>(null);
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState<number>(-1);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(-1);
  const [currentCriterionForLevel, setCurrentCriterionForLevel] = useState<RubricCriterion | null>(null);

  // Calculate total points whenever rubric criteria change
  useEffect(() => {
    try {
      const total = rubric.criteria.reduce((sum, criterion) => {
        // Skip invalid criteria
        if (!criterion || !Array.isArray(criterion.levels)) {
          return sum;
        }
        
        // Get the maximum points from the criterion's levels
        const maxPoints = criterion.levels.length > 0
          ? Math.max(...criterion.levels.map(level => {
              // Ensure points is a valid number
              const points = typeof level.points === 'number' ? level.points : 0;
              return isNaN(points) ? 0 : points;
            }))
          : 0;
        
        // Apply the weight (default to 1 if not specified or invalid)
        const weight = typeof criterion.weight === 'number' && !isNaN(criterion.weight) && criterion.weight > 0
          ? criterion.weight
          : 1;
        
        const weightedPoints = maxPoints * weight;
        
        return sum + weightedPoints;
      }, 0);
      
      // Ensure total is a valid number and round to 2 decimal places
      const validTotal = isNaN(total) ? 0 : parseFloat(total.toFixed(2));
      
      setRubric(prev => ({
        ...prev,
        totalPoints: validTotal
      }));
    } catch (error) {
      console.error('Error calculating total points:', error);
      // Set a default value in case of error
      setRubric(prev => ({
        ...prev,
        totalPoints: 0
      }));
    }
  }, [rubric.criteria]);

  // Handle basic rubric info changes
  const handleRubricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRubric(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open dialog to add a new criterion
  const handleAddCriterion = () => {
    setEditingCriterion(null);
    setCurrentCriterionIndex(-1); // -1 indicates a new criterion
    setCriterionDialogOpen(true);
  };

  // Open dialog to edit an existing criterion
  const handleEditCriterion = (index: number) => {
    const criterion = rubric.criteria[index];
    if (!criterion) return;
    
    setEditingCriterion(criterion);
    setCurrentCriterionIndex(index);
    setCriterionDialogOpen(true);
  };

  // Delete a criterion
  const handleDeleteCriterion = (index: number) => {
    if (window.confirm('Haluatko varmasti poistaa tämän arviointikriteerin?')) {
      const newCriteria = [...rubric.criteria];
      newCriteria.splice(index, 1);
      
      setRubric(prev => ({
        ...prev,
        criteria: newCriteria
      }));
    }
  };

  // Save criterion from dialog
  const handleSaveCriterion = (criterion: RubricCriterion) => {
    const newCriteria = [...rubric.criteria];
    
    if (currentCriterionIndex >= 0) {
      // Update existing criterion
      newCriteria[currentCriterionIndex] = criterion;
    } else {
      // Add new criterion
      newCriteria.push(criterion);
    }
    
    setRubric(prev => ({
      ...prev,
      criteria: newCriteria
    }));
    
    setCriterionDialogOpen(false);
    setEditingCriterion(null);
  };

  // Open dialog to add a new level to a criterion
  const handleAddLevel = (criterionIndex: number) => {
    const criterion = rubric.criteria[criterionIndex];
    if (!criterion) return;
    
    setEditingLevel(null);
    setCurrentCriterionIndex(criterionIndex);
    setCurrentLevelIndex(-1);
    setCurrentCriterionForLevel(criterion);
    setLevelDialogOpen(true);
  };

  // Open dialog to edit an existing level
  const handleEditLevel = (criterionIndex: number, levelIndex: number) => {
    const criterion = rubric.criteria[criterionIndex];
    if (!criterion) return;
    
    const level = criterion.levels[levelIndex];
    if (!level) return;
    
    setEditingLevel(level);
    setCurrentCriterionIndex(criterionIndex);
    setCurrentLevelIndex(levelIndex);
    setCurrentCriterionForLevel(criterion);
    setLevelDialogOpen(true);
  };

  // Delete a level from a criterion
  const handleDeleteLevel = (criterionIndex: number, levelIndex: number) => {
    if (window.confirm('Haluatko varmasti poistaa tämän arviointitason?')) {
      const newCriteria = [...rubric.criteria];
      const criterion = newCriteria[criterionIndex];
      
      if (criterion && Array.isArray(criterion.levels)) {
        const newLevels = [...criterion.levels];
        newLevels.splice(levelIndex, 1);
        criterion.levels = newLevels;
        
        setRubric(prev => ({
          ...prev,
          criteria: newCriteria
        }));
      }
    }
  };

  // Save level from dialog
  const handleSaveLevel = (level: RubricLevel) => {
    if (currentCriterionIndex < 0) return;
    
    const newCriteria = [...rubric.criteria];
    const criterion = newCriteria[currentCriterionIndex];
    
    if (!criterion) return;
    
    const newLevels = [...criterion.levels];
    
    if (currentLevelIndex >= 0) {
      // Update existing level
      newLevels[currentLevelIndex] = level;
    } else {
      // Add new level
      newLevels.push(level);
    }
    
    criterion.levels = newLevels;
    
    setRubric(prev => ({
      ...prev,
      criteria: newCriteria
    }));
    
    setLevelDialogOpen(false);
    setEditingLevel(null);
  };

  // Handle drag and drop reordering of criteria
  const handleReorderCriteria = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const newCriteria = [...rubric.criteria];
    const [removed] = newCriteria.splice(sourceIndex, 1);
    newCriteria.splice(destinationIndex, 0, removed);
    
    setRubric(prev => ({
      ...prev,
      criteria: newCriteria
    }));
  };

  // Move criterion up or down
  const handleMoveCriterion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === rubric.criteria.length - 1)
    ) {
      return;
    }
    
    const newCriteria = [...rubric.criteria];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newCriteria[index], newCriteria[targetIndex]] = [newCriteria[targetIndex], newCriteria[index]];
    
    setRubric(prev => ({
      ...prev,
      criteria: newCriteria
    }));
  };

  // Save the entire rubric
  const handleSaveRubric = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let savedRubric: Rubric;
      
      if (rubric.id) {
        // Update existing rubric
        savedRubric = await rubricService.updateRubric(rubric.id, rubric);
      } else {
        // Create new rubric
        savedRubric = await rubricService.createRubric(rubric);
      }
      
      setRubric(savedRubric);
      setSuccess(true);
      
      if (onSave) {
        onSave(savedRubric);
      }
    } catch (error) {
      console.error('Error saving rubric:', error);
      setError('Arviointimatriisin tallentaminen epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {rubric.id ? 'Muokkaa arviointimatriisia' : 'Luo uusi arviointimatriisi'}
        </Typography>
        
        <TextField
          name="title"
          label="Arviointimatriisin otsikko"
          value={rubric.title}
          onChange={handleRubricChange}
          fullWidth
          margin="normal"
        />
        
        <TextField
          name="description"
          label="Arviointimatriisin kuvaus"
          value={rubric.description}
          onChange={handleRubricChange}
          fullWidth
          multiline
          rows={2}
          margin="normal"
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
          <Typography variant="h6">
            Arviointikriteerit
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              (Yhteensä: {rubric.totalPoints} pistettä)
            </Typography>
          </Typography>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCriterion}
          >
            Lisää kriteeri
          </Button>
        </Box>
        
        <RubricCriterionList
          criteria={rubric.criteria}
          onEditCriterion={handleEditCriterion}
          onDeleteCriterion={handleDeleteCriterion}
          onAddLevel={handleAddLevel}
          onEditLevel={handleEditLevel}
          onDeleteLevel={handleDeleteLevel}
          onReorderCriteria={handleReorderCriteria}
          onMoveCriterion={handleMoveCriterion}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {onCancel && (
            <Button onClick={onCancel} sx={{ mr: 2 }}>
              Peruuta
            </Button>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveRubric}
            disabled={loading}
          >
            {loading ? 'Tallennetaan...' : 'Tallenna arviointimatriisi'}
          </Button>
        </Box>
      </Paper>
      
      {/* Criterion Form Dialog */}
      <RubricCriterionForm
        open={criterionDialogOpen}
        onClose={() => setCriterionDialogOpen(false)}
        onSave={handleSaveCriterion}
        criterion={editingCriterion}
        isNew={currentCriterionIndex === -1}
      />
      
      {/* Level Form Dialog */}
      <RubricLevelForm
        open={levelDialogOpen}
        onClose={() => setLevelDialogOpen(false)}
        onSave={handleSaveLevel}
        level={editingLevel}
        isNew={currentLevelIndex === -1}
        criterionTitle={currentCriterionForLevel?.title}
      />
      
      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Arviointimatriisi tallennettu onnistuneesti!
        </Alert>
      </Snackbar>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RubricEditor; 