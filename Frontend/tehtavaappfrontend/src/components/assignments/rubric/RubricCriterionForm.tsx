import React, { useEffect } from 'react';
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
import { RubricCriterion } from '../../../types/rubric';
import { useFormValidation, validationRules } from '../../../hooks/useFormValidation';

interface RubricCriterionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (criterion: RubricCriterion) => void;
  criterion: RubricCriterion | null;
  isNew: boolean;
}

// Define form values type
interface CriterionFormValues {
  title: string;
  description: string;
  weight: number;
}

const RubricCriterionForm: React.FC<RubricCriterionFormProps> = ({
  open,
  onClose,
  onSave,
  criterion,
  isNew
}) => {
  // Define the validation schema for the form
  const validationSchema = {
    title: [
      validationRules.required('Otsikko on pakollinen')
    ],
    description: [
      validationRules.required('Kuvaus on pakollinen')
    ],
    weight: [
      validationRules.min(0.1, 'Painoarvon on oltava suurempi kuin 0')
    ]
  };

  // Initial form values
  const initialValues: CriterionFormValues = {
    title: '',
    description: '',
    weight: 1
  };

  // Use our custom form validation hook
  const {
    values,
    errors,
    handleChange,
    setValues,
    validateForm,
    handleBlur
  } = useFormValidation(validationSchema, initialValues);

  // Initialize form when criterion changes
  useEffect(() => {
    if (criterion) {
      setValues({
        title: criterion.title,
        description: criterion.description,
        weight: criterion.weight
      });
    } else {
      // Reset to default values for new criterion
      setValues(initialValues);
    }
  }, [criterion, setValues, initialValues]);

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedCriterion: RubricCriterion = {
      id: criterion?.id || `temp_criterion_${Date.now()}`,
      title: values.title,
      description: values.description,
      weight: values.weight,
      levels: criterion?.levels || []
    };

    onSave(updatedCriterion);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isNew ? 'Lisää arviointikriteeri' : 'Muokkaa arviointikriteeriä'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Kriteerin otsikko"
            fullWidth
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
          />
          <TextField
            label="Kriteerin kuvaus"
            fullWidth
            multiline
            rows={3}
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.description}
            helperText={errors.description}
            margin="normal"
          />
          <TextField
            label="Painoarvo"
            type="number"
            fullWidth
            name="weight"
            value={values.weight}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!errors.weight}
            helperText={errors.weight || 'Painoarvo määrittää kriteerin suhteellisen merkityksen arvioinnissa'}
            margin="normal"
            InputProps={{
              inputProps: { min: 0.1, step: 0.1 },
              endAdornment: <InputAdornment position="end">×</InputAdornment>
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

export default RubricCriterionForm; 