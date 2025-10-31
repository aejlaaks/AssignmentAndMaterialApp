import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Grade as GradeIcon
} from '@mui/icons-material';

interface BatchGradingFormProps {
  selectedCount: number;
  batchGrade: string;
  batchFeedback: string;
  loading: boolean;
  onBatchGradeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBatchFeedbackChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenConfirmDialog: () => void;
}

const BatchGradingForm: React.FC<BatchGradingFormProps> = ({
  selectedCount,
  batchGrade,
  batchFeedback,
  loading,
  onBatchGradeChange,
  onBatchFeedbackChange,
  onOpenConfirmDialog
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <GradeIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6">Eräarviointi</Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {selectedCount === 0
          ? 'Valitse palautuksia arvioidaksesi niitä kerralla'
          : `${selectedCount} palautusta valittu arviointia varten`}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Arvosana"
            type="number"
            value={batchGrade}
            onChange={onBatchGradeChange}
            disabled={selectedCount === 0}
            InputProps={{
              inputProps: { min: 0, max: 5, step: 0.5 }
            }}
          />
        </Grid>
        <Grid item xs={12} md={9}>
          <TextField
            fullWidth
            label="Palaute"
            multiline
            rows={2}
            value={batchFeedback}
            onChange={onBatchFeedbackChange}
            disabled={selectedCount === 0}
            placeholder="Kirjoita palaute kaikille valituille palautuksille..."
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
          onClick={onOpenConfirmDialog}
          disabled={selectedCount === 0 || loading || !batchGrade}
        >
          {loading ? 'Tallennetaan...' : 'Tallenna arvioinnit'}
        </Button>
      </Box>
    </Paper>
  );
};

export default BatchGradingForm; 