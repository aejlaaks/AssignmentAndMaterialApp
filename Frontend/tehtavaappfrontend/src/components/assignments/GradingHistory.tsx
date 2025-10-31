import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { GradingHistory } from '../../types';
import { gradingHistoryService } from '../../services/assignments/gradingHistoryService';
import { formatDate } from '../../utils/dateUtils';

interface GradingHistoryComponentProps {
  submissionId: string;
  onRevert?: (historyId: string) => void;
}

const GradingHistoryComponent: React.FC<GradingHistoryComponentProps> = ({
  submissionId,
  onRevert
}) => {
  const [history, setHistory] = useState<GradingHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHistory();
  }, [submissionId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await gradingHistoryService.getGradingHistoryBySubmission(submissionId);
      setHistory(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching grading history:', err);
      setError('Arviointihistorian hakeminen epäonnistui');
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!selectedHistoryId) return;
    
    try {
      await gradingHistoryService.revertToHistoryVersion(selectedHistoryId);
      setSuccess(true);
      setConfirmDialogOpen(false);
      
      // Refresh history after revert
      fetchHistory();
      
      if (onRevert) {
        onRevert(selectedHistoryId);
      }
    } catch (err) {
      console.error('Error reverting to history version:', err);
      setError('Arviointihistorian palauttaminen epäonnistui');
    }
  };

  const handleOpenConfirmDialog = (historyId: string) => {
    setSelectedHistoryId(historyId);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedHistoryId(null);
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const toggleExpand = (historyId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [historyId]: !prev[historyId]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Arviointihistoria</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {history.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
          Ei arviointihistoriaa saatavilla
        </Typography>
      ) : (
        <List>
          {history.map((item) => (
            <React.Fragment key={item.id}>
              <ListItem 
                button 
                onClick={() => toggleExpand(item.id)}
                sx={{ 
                  bgcolor: 'background.default',
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {item.gradedByName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {formatDate(item.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2">
                      Arvosana: {item.grade}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => toggleExpand(item.id)}>
                    {expandedItems[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 9, pr: 2, pb: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Palaute:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {item.feedback || 'Ei palautetta'}
                  </Typography>
                  
                  {item.notes && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Muistiinpanot:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                        {item.notes}
                      </Typography>
                    </>
                  )}
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RestoreIcon />}
                    onClick={() => handleOpenConfirmDialog(item.id)}
                    sx={{ mt: 1 }}
                  >
                    Palauta tähän versioon
                  </Button>
                </Box>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      )}
      
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Vahvista palautus</DialogTitle>
        <DialogContent>
          <Typography>
            Haluatko varmasti palauttaa arvioinnin tähän versioon? Nykyinen arviointi korvataan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Peruuta</Button>
          <Button onClick={handleRevert} color="primary" variant="contained">
            Palauta
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Arviointi palautettu onnistuneesti!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default GradingHistoryComponent; 