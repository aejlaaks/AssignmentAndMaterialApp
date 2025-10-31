import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Psychology as PsychologyIcon,
  TipsAndUpdates as TipsIcon,
} from '@mui/icons-material';
import { AIGradingResult } from '../../types';

interface AIGradingSuggestionProps {
  aiResult: AIGradingResult;
  onAccept: (result: AIGradingResult) => void;
  onReject: () => void;
  onModify?: (result: AIGradingResult) => void;
  isLoading?: boolean;
}

export const AIGradingSuggestion: React.FC<AIGradingSuggestionProps> = ({
  aiResult,
  onAccept,
  onReject,
  onModify,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGrade, setEditedGrade] = useState(aiResult.grade.toString());
  const [editedFeedback, setEditedFeedback] = useState(aiResult.feedback);

  const handleSaveEdits = () => {
    const modifiedResult: AIGradingResult = {
      ...aiResult,
      grade: parseFloat(editedGrade),
      feedback: editedFeedback,
    };

    if (onModify) {
      onModify(modifiedResult);
    }
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditedGrade(aiResult.grade.toString());
    setEditedFeedback(aiResult.feedback);
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence: number): 'error' | 'warning' | 'success' => {
    if (confidence < 0.5) return 'error';
    if (confidence < 0.75) return 'warning';
    return 'success';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence < 0.5) return 'Matala';
    if (confidence < 0.75) return 'Keskitaso';
    return 'Korkea';
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        backgroundColor: 'background.paper',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <PsychologyIcon color="primary" />
          <Typography variant="h6" component="div">
            AI-arviointiehdotus
          </Typography>
          <Chip
            label={`${aiResult.provider} (${aiResult.model})`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        <Alert severity="info" icon={<TipsIcon />} sx={{ mb: 2 }}>
          Tämä on AI:n generoima ehdotus. Tarkista ja muokkaa tarvittaessa ennen hyväksymistä.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Arvosana
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  type="number"
                  value={editedGrade}
                  onChange={(e) => setEditedGrade(e.target.value)}
                  inputProps={{ min: 0, max: 5, step: 0.5 }}
                  size="small"
                />
              ) : (
                <Typography variant="h4" color="primary">
                  {aiResult.grade.toFixed(1)} / 5
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Luotettavuus
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={aiResult.confidence * 100}
                  color={getConfidenceColor(aiResult.confidence)}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Chip
                  label={getConfidenceLabel(aiResult.confidence)}
                  size="small"
                  color={getConfidenceColor(aiResult.confidence)}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {(aiResult.confidence * 100).toFixed(0)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Palaute
            </Typography>
            {!isEditing && (
              <Tooltip title="Muokkaa palautetta">
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={6}
              value={editedFeedback}
              onChange={(e) => setEditedFeedback(e.target.value)}
              variant="outlined"
            />
          ) : (
            <Box
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
              }}
            >
              <Typography variant="body2">{aiResult.feedback}</Typography>
            </Box>
          )}
        </Box>

        {aiResult.reasoning && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Perustelut
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'info.lighter',
                borderRadius: 1,
                borderLeft: '3px solid',
                borderLeftColor: 'info.main',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {aiResult.reasoning}
              </Typography>
            </Box>
          </Box>
        )}

        {aiResult.criteriaScores && Object.keys(aiResult.criteriaScores).length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Kriteerit
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(aiResult.criteriaScores).map(([criterionId, score]) => (
                <Grid item xs={12} sm={6} key={criterionId}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">{criterionId}</Typography>
                    <Chip label={score.toFixed(1)} size="small" color="primary" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={2} justifyContent="flex-end">
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                onClick={handleCancelEdits}
                disabled={isLoading}
              >
                Peruuta
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveEdits}
                disabled={isLoading}
                startIcon={<CheckCircleIcon />}
              >
                Tallenna muutokset
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={onReject}
                disabled={isLoading}
                startIcon={<CancelIcon />}
              >
                Hylkää
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                startIcon={<EditIcon />}
              >
                Muokkaa
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => onAccept(aiResult)}
                disabled={isLoading}
                startIcon={<CheckCircleIcon />}
              >
                Hyväksy ja käytä
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIGradingSuggestion;

