import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Slider,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { Rubric, RubricGradeDTO, RubricCriterion, RubricLevel } from '../../types/rubric';
import { ISubmission } from '../../services/assignments/submissionService';
import { rubricService } from '../../services/assignments/rubricService';

interface RubricGradingProps {
  rubric: Rubric;
  submission: ISubmission;
  onGradingComplete?: (grade: number, feedback: string, criteriaScores: Record<string, { points: number, feedback?: string }>) => void;
}

const RubricGrading: React.FC<RubricGradingProps> = ({
  rubric,
  submission,
  onGradingComplete
}) => {
  const [criteriaScores, setCriteriaScores] = useState<Record<string, { points: number, feedback?: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState<string>('');
  const [totalScore, setTotalScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Initialize criteria scores
  useEffect(() => {
    const initialScores: Record<string, { points: number, feedback?: string }> = {};
    
    rubric.criteria.forEach(criterion => {
      initialScores[criterion.id] = {
        points: 0,
        feedback: ''
      };
    });
    
    setCriteriaScores(initialScores);
  }, [rubric]);

  // Calculate total score whenever criteria scores change
  useEffect(() => {
    let total = 0;
    let maxTotal = 0;
    
    rubric.criteria.forEach(criterion => {
      const score = criteriaScores[criterion.id]?.points || 0;
      total += score * (criterion.weight / 100);
      
      // Find the maximum points for this criterion
      const maxPoints = Math.max(...criterion.levels.map(level => level.points));
      maxTotal += maxPoints * (criterion.weight / 100);
    });
    
    // Normalize to a 0-100 scale
    const normalizedScore = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    setTotalScore(Math.round(normalizedScore * 10) / 10); // Round to 1 decimal place
  }, [criteriaScores, rubric]);

  const handleScoreChange = (criterionId: string, points: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        points
      }
    }));
  };

  const handleFeedbackChange = (criterionId: string, feedback: string) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        feedback
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const criteriaGrades = Object.entries(criteriaScores).map(([criterionId, data]) => {
        // Find the level ID that corresponds to the points
        const criterion = rubric.criteria.find(c => c.id === criterionId);
        const level = criterion?.levels.find(l => l.points === data.points);
        
        return {
          criterionId,
          levelId: level?.id || '',
          points: data.points,
          feedback: data.feedback
        };
      });
      
      const gradeData: RubricGradeDTO = {
        submissionId: submission.id,
        criteriaGrades,
        overallFeedback,
        totalScore
      };
      
      // Use the gradeWithRubric method with correct parameters
      const result = await rubricService.gradeWithRubric(submission.id, gradeData);
      
      setSuccess(true);
      
      if (onGradingComplete) {
        onGradingComplete(totalScore, overallFeedback, criteriaScores);
      }
    } catch (err) {
      console.error('Error submitting rubric grading:', err);
      setError('Arvioinnin tallentaminen epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  const getScoreColor = (score: number, criterion: RubricCriterion) => {
    // Find the maximum points for this criterion
    const maxPoints = Math.max(...criterion.levels.map(level => level.points));
    
    // Calculate the percentage of the maximum
    const percentage = maxPoints > 0 ? (score / maxPoints) * 100 : 0;
    
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'info.main';
    if (percentage >= 40) return 'warning.main';
    return percentage > 0 ? 'error.main' : 'text.disabled';
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Arviointimatriisi: {rubric.title}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {rubric.description}
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Kokonaispisteet: {totalScore}/100
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Slider
              value={totalScore}
              max={100}
              disabled
              valueLabelDisplay="auto"
              aria-labelledby="total-score-slider"
              sx={{
                '& .MuiSlider-thumb': {
                  color: totalScore >= 80 ? 'success.main' : 
                         totalScore >= 60 ? 'info.main' : 
                         totalScore >= 40 ? 'warning.main' : 
                         'error.main'
                },
                '& .MuiSlider-track': {
                  color: totalScore >= 80 ? 'success.main' : 
                         totalScore >= 60 ? 'info.main' : 
                         totalScore >= 40 ? 'warning.main' : 
                         'error.main'
                }
              }}
            />
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {rubric.criteria.map((criterion) => {
        const maxPoints = Math.max(...criterion.levels.map(level => level.points));
        const currentPoints = criteriaScores[criterion.id]?.points || 0;
        
        return (
          <Card key={criterion.id} variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {criterion.title} ({criterion.weight}%)
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: getScoreColor(currentPoints, criterion),
                      fontWeight: 'bold'
                    }}
                  >
                    {currentPoints}/{maxPoints}
                  </Typography>
                </Box>
              }
              subheader={criterion.description}
            />
            
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography id={`criterion-${criterion.id}-slider-label`} gutterBottom>
                  Pisteet
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs>
                    <Slider
                      value={currentPoints}
                      onChange={(_, value) => handleScoreChange(criterion.id, value as number)}
                      step={null}
                      marks={criterion.levels.map(level => ({
                        value: level.points,
                        label: level.title
                      }))}
                      min={0}
                      max={maxPoints}
                      valueLabelDisplay="auto"
                      aria-labelledby={`criterion-${criterion.id}-slider-label`}
                    />
                  </Grid>
                </Grid>
              </Box>
              
              {criterion.levels.map(level => (
                <Box 
                  key={level.id} 
                  sx={{ 
                    mb: 1, 
                    p: 1, 
                    borderLeft: '4px solid',
                    borderColor: currentPoints === level.points ? 
                      getScoreColor(level.points, criterion) : 
                      'divider',
                    bgcolor: currentPoints === level.points ? 
                      alpha => getScoreColor(level.points, criterion) + '10' : 
                      'transparent'
                  }}
                >
                  <Typography variant="subtitle1">
                    {level.title} ({level.points} p)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {level.description}
                  </Typography>
                </Box>
              ))}
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Palaute kriteeristä"
                  multiline
                  rows={2}
                  value={criteriaScores[criterion.id]?.feedback || ''}
                  onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        );
      })}
      
      <Box sx={{ mt: 4 }}>
        <TextField
          fullWidth
          label="Yleinen palaute"
          multiline
          rows={4}
          value={overallFeedback}
          onChange={(e) => setOverallFeedback(e.target.value)}
          variant="outlined"
          sx={{ mb: 3 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          Tallenna arviointi
        </Button>
      </Box>
      
      <Snackbar open={!!error || success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || "Arviointi tallennettu onnistuneesti!"}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RubricGrading; 