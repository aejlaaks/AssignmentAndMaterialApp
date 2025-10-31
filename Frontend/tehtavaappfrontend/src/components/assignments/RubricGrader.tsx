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
  Card,
  CardContent,
  CardHeader,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  Rubric, 
  RubricCriterion, 
  RubricLevel, 
  RubricGradeDTO 
} from '../../types/rubric';
import { rubricService } from '../../services/assignments/rubricService';

interface ExtendedRubric extends Omit<Rubric, 'criteria'> {
  criteria: ExtendedRubricCriterion[];
}

interface RubricGraderProps {
  submissionId: string;
  rubric: ExtendedRubric;
  initialGrades?: any;
  onGradingComplete?: (data: any) => void;
  readOnly?: boolean;
}

interface CriterionGrade {
  criterionId: string;
  levelId: string;
  points: number;
  feedback: string;
}

interface ExtendedRubricCriterion extends RubricCriterion {
  maxPoints?: number;
}

const RubricGrader: React.FC<RubricGraderProps> = ({
  submissionId,
  rubric,
  initialGrades,
  onGradingComplete,
  readOnly = false
}) => {
  const [criteriaGrades, setCriteriaGrades] = useState<CriterionGrade[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<string>('');
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Initialize grades from initial data or create empty grades
  useEffect(() => {
    if (initialGrades) {
      // If we have initial grades, use them
      const grades = initialGrades.criteriaGrades.map((grade: any) => ({
        criterionId: grade.criterionId,
        levelId: grade.levelId,
        points: grade.points,
        feedback: grade.feedback || ''
      }));
      
      setCriteriaGrades(grades);
      setOverallFeedback(initialGrades.overallFeedback || '');
    } else {
      // Otherwise create empty grades for each criterion
      const emptyGrades = rubric.criteria.map(criterion => ({
        criterionId: criterion.id,
        levelId: '',
        points: 0,
        feedback: ''
      }));
      
      setCriteriaGrades(emptyGrades);
    }
  }, [rubric, initialGrades]);

  // Calculate total points whenever grades change
  useEffect(() => {
    let total = 0;
    
    criteriaGrades.forEach(grade => {
      const criterion = rubric.criteria.find(c => c.id === grade.criterionId);
      if (criterion) {
        // Calculate weighted points
        total += grade.points * (criterion.weight / 100);
      }
    });
    
    setTotalPoints(parseFloat(total.toFixed(2)));
  }, [criteriaGrades, rubric.criteria]);

  // Handle level selection for a criterion
  const handleLevelSelect = (criterionId: string, levelId: string) => {
    if (readOnly) return;
    
    const criterion = rubric.criteria.find(c => c.id === criterionId);
    const level = criterion?.levels.find(l => l.id === levelId);
    
    if (!criterion || !level) return;
    
    setCriteriaGrades(prev => {
      return prev.map(grade => {
        if (grade.criterionId === criterionId) {
          return {
            ...grade,
            levelId,
            points: level.points
          };
        }
        return grade;
      });
    });
  };

  // Handle feedback change for a criterion
  const handleFeedbackChange = (criterionId: string, feedback: string) => {
    if (readOnly) return;
    
    setCriteriaGrades(prev => {
      return prev.map(grade => {
        if (grade.criterionId === criterionId) {
          return {
            ...grade,
            feedback
          };
        }
        return grade;
      });
    });
  };

  // Handle overall feedback change
  const handleOverallFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    setOverallFeedback(e.target.value);
  };

  // Submit grades
  const handleSubmit = async () => {
    // Check if all criteria have been graded
    const incompleteGrades = criteriaGrades.filter(grade => !grade.levelId);
    
    if (incompleteGrades.length > 0) {
      const incompleteCriteria = incompleteGrades.map(grade => {
        const criterion = rubric.criteria.find(c => c.id === grade.criterionId);
        return criterion?.title || 'Unknown criterion';
      });
      
      setError(`Please complete grading for all criteria: ${incompleteCriteria.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const totalScore = calculateGrade();
      const gradeData: RubricGradeDTO = {
        submissionId,
        criteriaGrades: criteriaGrades.map(grade => ({
          criterionId: grade.criterionId,
          levelId: grade.levelId,
          points: grade.points,
          feedback: grade.feedback || undefined
        })),
        overallFeedback: overallFeedback || undefined,
        totalScore
      };
      
      const result = await rubricService.gradeWithRubric(submissionId, gradeData);
      setSuccess(true);
      
      if (onGradingComplete) {
        onGradingComplete(result);
      }
    } catch (err) {
      console.error('Error submitting rubric grades:', err);
      setError('Failed to submit grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  // Find the selected level for a criterion
  const getSelectedLevel = (criterionId: string): RubricLevel | undefined => {
    const grade = criteriaGrades.find(g => g.criterionId === criterionId);
    if (!grade || !grade.levelId) return undefined;
    
    const criterion = rubric.criteria.find(c => c.id === criterionId);
    return criterion?.levels.find(l => l.id === grade.levelId);
  };

  // Calculate the grade based on total points
  const calculateGrade = (): number => {
    // Simple mapping from points to grade (0-5 scale)
    // This can be customized based on your grading scale
    const maxPoints = rubric.totalPoints;
    const percentage = (totalPoints / maxPoints) * 100;
    
    if (percentage >= 90) return 5;
    if (percentage >= 80) return 4;
    if (percentage >= 70) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 50) return 1;
    return 0;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          {rubric.title}
          {readOnly && <Chip label="Vain luku" color="info" size="small" sx={{ ml: 1 }} />}
        </Typography>
        <Box>
          <Typography variant="h6" component="span" sx={{ mr: 2 }}>
            Pisteet: {totalPoints}/{rubric.totalPoints}
          </Typography>
          <Typography variant="h6" component="span">
            Arvosana: {calculateGrade()}
          </Typography>
        </Box>
      </Box>
      
      {rubric.description && (
        <Typography variant="body1" sx={{ mb: 3 }}>
          {rubric.description}
        </Typography>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      {rubric.criteria.map((criterion) => {
        const selectedLevel = getSelectedLevel(criterion.id);
        
        return (
          <Card key={criterion.id} sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">{criterion.title}</Typography>
                  <Tooltip title={`Painoarvo: ${criterion.weight}%, Maksimipisteet: ${criterion.maxPoints}`}>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Painoarvo: {criterion.weight}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maksimipisteet: {criterion.maxPoints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valitut pisteet: {selectedLevel ? selectedLevel.points : 0}/{criterion.maxPoints}
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              {criterion.description && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {criterion.description}
                </Typography>
              )}
              
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <FormLabel component="legend">Tasot</FormLabel>
                <RadioGroup
                  value={criteriaGrades.find(g => g.criterionId === criterion.id)?.levelId || ''}
                  onChange={(e) => handleLevelSelect(criterion.id, e.target.value)}
                >
                  {criterion.levels.map((level) => (
                    <FormControlLabel
                      key={level.id}
                      value={level.id}
                      control={<Radio disabled={readOnly} />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            {level.title} ({level.points} pistettä)
                          </Typography>
                          {level.description && (
                            <Typography variant="body2" color="text.secondary">
                              {level.description}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: selectedLevel?.id === level.id ? 'action.selected' : 'transparent'
                      }}
                      disabled={readOnly}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              
              <TextField
                label="Palaute tähän kriteeriin"
                fullWidth
                multiline
                rows={2}
                value={criteriaGrades.find(g => g.criterionId === criterion.id)?.feedback || ''}
                onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                sx={{ mt: 2 }}
                disabled={readOnly}
              />
            </CardContent>
          </Card>
        );
      })}
      
      <TextField
        label="Yleinen palaute"
        fullWidth
        multiline
        rows={4}
        value={overallFeedback}
        onChange={handleOverallFeedbackChange}
        sx={{ mb: 3 }}
        disabled={readOnly}
      />
      
      {!readOnly && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Tallennetaan...' : 'Tallenna arviointi'}
          </Button>
        </Box>
      )}
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success">
          Arviointi tallennettu onnistuneesti!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RubricGrader; 