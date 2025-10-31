import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  CircularProgress,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { CourseGrade, GradingType } from '../../services/courses/courseGradingService';

interface CourseGradeStatsProps {
  grades: CourseGrade[];
  totalStudents: number;
  loading?: boolean;
}

export const CourseGradeStats: React.FC<CourseGradeStatsProps> = ({ 
  grades, 
  totalStudents, 
  loading = false 
}) => {
  const [tabValue, setTabValue] = React.useState(0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if we have different grading types
  const hasNumericGrades = grades.some(g => g.gradingType === GradingType.Numeric);
  const hasPassFailGrades = grades.some(g => g.gradingType === GradingType.PassFail);

  // If we have both types, filter by the selected tab
  const filteredGrades = tabValue === 0 
    ? grades 
    : tabValue === 1 
      ? grades.filter(g => g.gradingType === GradingType.Numeric)
      : grades.filter(g => g.gradingType === GradingType.PassFail);

  // Calculate statistics
  const gradedStudentsCount = filteredGrades.length;
  const gradedPercentage = totalStudents > 0 
    ? Math.round((gradedStudentsCount / totalStudents) * 100) 
    : 0;

  // Calculate statistics for numeric grades (1-5)
  const numericStats = useMemo(() => {
    const numericGrades = grades.filter(g => g.gradingType === GradingType.Numeric);
    
    if (numericGrades.length === 0) {
      return {
        count: 0,
        average: 0,
        distribution: [0, 0, 0, 0, 0]  // For grades 1-5
      };
    }
    
    // Calculate average
    const sum = numericGrades.reduce((acc, g) => acc + g.grade, 0);
    const average = sum / numericGrades.length;
    
    // Calculate distribution
    const distribution = [0, 0, 0, 0, 0];  // For grades 1-5
    numericGrades.forEach(g => {
      const grade = Math.round(g.grade);
      if (grade >= 1 && grade <= 5) {
        distribution[grade - 1]++;
      }
    });
    
    return {
      count: numericGrades.length,
      average: average,
      distribution
    };
  }, [grades]);
  
  // Calculate statistics for pass/fail grades
  const passFailStats = useMemo(() => {
    const passFailGrades = grades.filter(g => g.gradingType === GradingType.PassFail);
    
    if (passFailGrades.length === 0) {
      return {
        count: 0,
        passCount: 0,
        failCount: 0
      };
    }
    
    const passCount = passFailGrades.filter(g => g.passed).length;
    const failCount = passFailGrades.length - passCount;
    
    return {
      count: passFailGrades.length,
      passCount,
      failCount
    };
  }, [grades]);

  // Calculate overall completion rate
  const completionRate = totalStudents > 0 ? (grades.length / totalStudents) * 100 : 0;

  // Find the most common grade (mode)
  const mostCommonGrade = useMemo(() => {
    if (grades.length === 0) return null;
    
    const gradeCounts: Record<number, number> = {};
    grades.forEach(g => {
      const grade = Math.round(g.grade);
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommon = null;
    
    Object.entries(gradeCounts).forEach(([grade, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = grade;
      }
    });
    
    return {
      grade: mostCommon,
      count: maxCount
    };
  }, [grades]);

  // Format number with one decimal place
  const formatNumber = (num: number) => num.toFixed(1);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Tab control for showing different grading types */}
      {hasNumericGrades && hasPassFailGrades && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="All Grades" />
            <Tab label="Numeric Grades (1-5)" />
            <Tab label="Pass/Fail Grades" />
          </Tabs>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Graded Students</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {gradedStudentsCount}/{totalStudents}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={gradedPercentage} 
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {gradedPercentage}% of students have received a course grade
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Show average grade only if we have numeric grades */}
        {(tabValue !== 2 && numericStats.count > 0) && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GradeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Average Grade</Typography>
                </Box>
                <Typography variant="h3" align="center" sx={{ my: 2 }}>
                  {formatNumber(numericStats.average)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Average grade across all students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Show pass rate only if we have pass/fail grades */}
        {(tabValue !== 1 && passFailStats.count > 0) && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Pass Rate</Typography>
                </Box>
                <Typography variant="h3" align="center" sx={{ my: 2 }}>
                  {Math.round((passFailStats.passCount / passFailStats.count) * 100)}%
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {passFailStats.passCount} passed, {passFailStats.failCount} failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Final Grades</Typography>
              </Box>
              <Typography variant="h3" align="center" sx={{ my: 2 }}>
                {filteredGrades.filter(g => g.isFinal).length}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Number of finalized course grades
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Show numeric grade distribution */}
        {(tabValue !== 2 && numericStats.count > 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Grade Distribution</Typography>
                <Box sx={{ mt: 3 }}>
                  {[1, 2, 3, 4, 5].map((gradeValue) => (
                    <Box key={gradeValue} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ minWidth: 20 }}>
                          {gradeValue}
                        </Typography>
                        <Box sx={{ flexGrow: 1, mx: 1 }}>
                          <Tooltip title={`${numericStats.distribution[gradeValue - 1]} students (${(numericStats.distribution[gradeValue - 1] / numericStats.count * 100).toFixed(1)}%)`}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(numericStats.distribution[gradeValue - 1] / numericStats.count * 100)} 
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 30 }}>
                          {numericStats.distribution[gradeValue - 1]}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Show pass/fail distribution */}
        {(tabValue !== 1 && passFailStats.count > 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pass/Fail Distribution</Typography>
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 60 }}>
                        <CheckIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Pass</Typography>
                      </Box>
                      <Box sx={{ flex: 1, mx: 1 }}>
                        <Tooltip title={`${passFailStats.passCount} students (${((passFailStats.passCount / passFailStats.count) * 100).toFixed(1)}%)`}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(passFailStats.passCount / passFailStats.count) * 100} 
                            color="success"
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                        {passFailStats.passCount} ({Math.round((passFailStats.passCount / passFailStats.count) * 100)}%)
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 60 }}>
                        <CloseIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">Fail</Typography>
                      </Box>
                      <Box sx={{ flex: 1, mx: 1 }}>
                        <Tooltip title={`${passFailStats.failCount} students (${((passFailStats.failCount / passFailStats.count) * 100).toFixed(1)}%)`}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(passFailStats.failCount / passFailStats.count) * 100} 
                            color="error"
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right' }}>
                        {passFailStats.failCount} ({Math.round((passFailStats.failCount / passFailStats.count) * 100)}%)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 