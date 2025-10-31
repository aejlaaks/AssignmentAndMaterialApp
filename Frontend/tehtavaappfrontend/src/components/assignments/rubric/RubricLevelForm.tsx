import React from 'react';
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { RubricLevel } from '../../../types/rubric';

interface RubricLevelFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (level: RubricLevel) => void;
  level: RubricLevel | null;
  isNew: boolean;
  criterionTitle?: string;
}

const RubricLevelForm: React.FC<RubricLevelFormProps> = ({
  open,
  onClose,
  onSave,
  level,
  isNew,
  criterionTitle
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [points, setPoints] = React.useState<number>(0);
  const [errors, setErrors] = React.useState<{
    title?: string;
    description?: string;
    points?: string;
  }>({});

  // Initialize form when level changes
  React.useEffect(() => {
    if (level) {
      setTitle(level.title);
      setDescription(level.description);
      setPoints(level.points);
    } else {
      // Default values for new level
      setTitle('');
      setDescription('');
      setPoints(0);
    }
    setErrors({});
  }, [level]);

  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      description?: string;
      points?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = 'Otsikko on pakollinen';
    }

    if (!description.trim()) {
      newErrors.description = 'Kuvaus on pakollinen';
    }

    if (points < 0) {
      newErrors.points = 'Pisteiden on oltava vähintään 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedLevel: RubricLevel = {
      id: level?.id || `temp_level_${Date.now()}`,
      title,
      description,
      points
    };

    onSave(updatedLevel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isNew 
          ? `Lisää taso${criterionTitle ? ` kriteerille "${criterionTitle}"` : ''}`
          : `Muokkaa tasoa${criterionTitle ? ` kriteerille "${criterionTitle}"` : ''}`
        }
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Tason otsikko"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
          />
          <TextField
            label="Tason kuvaus"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            margin="normal"
          />
          <TextField
            label="Pisteet"
            type="number"
            fullWidth
            value={points}
            onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
            error={!!errors.points}
            helperText={errors.points || 'Tason pisteet'}
            margin="normal"
            InputProps={{
              inputProps: { min: 0, step: 0.5 },
              endAdornment: <InputAdornment position="end">p</InputAdornment>
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Peruuta
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Tallenna
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RubricLevelForm; 