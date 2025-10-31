import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';

interface BatchGradingConfirmDialogProps {
  open: boolean;
  selectedCount: number;
  batchGrade: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const BatchGradingConfirmDialog: React.FC<BatchGradingConfirmDialogProps> = ({
  open,
  selectedCount,
  batchGrade,
  loading,
  onClose,
  onConfirm
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Vahvista eräarviointi</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Olet antamassa arvosanan {batchGrade} yhteensä {selectedCount} palautukselle. 
          Tämä toiminto korvaa mahdolliset aiemmat arvosanat ja palautteet valituille palautuksille.
          Haluatko jatkaa?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Peruuta
        </Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} /> : null}
        >
          {loading ? 'Tallennetaan...' : 'Vahvista'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchGradingConfirmDialog; 