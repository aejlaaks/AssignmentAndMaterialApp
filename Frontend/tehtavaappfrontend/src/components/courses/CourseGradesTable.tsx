import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Chip,
  MenuItem,
  Snackbar,
  Alert,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Loop as LoopIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import courseGradingService, { CourseGrade, SaveCourseGradeRequest, GradingType } from '../../services/courses/courseGradingService';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';

interface CourseGradesTableProps {
  courseId: number;
  students: Array<{ id: string, name: string }>;
  onGradeUpdated?: () => void;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export const CourseGradesTable: React.FC<CourseGradesTableProps> = ({ courseId, students, onGradeUpdated }) => {
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
  const [editGrade, setEditGrade] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [editIsFinal, setEditIsFinal] = useState<boolean>(false);
  const [gradingType, setGradingType] = useState<GradingType>(GradingType.Numeric);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Grade configuration
  const numericGrades = [1, 2, 3, 4, 5];
  const passFailGrades = ['Pass', 'Fail'];

  // Fetch course grades
  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await courseGradingService.getCourseGrades(courseId);
      setGrades(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching course grades');
      console.error('Error fetching course grades:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate a student's grade based on assignments
  const calculateGrade = async (studentId: string) => {
    try {
      setCalculating(true);
      const calculatedGrade = await courseGradingService.calculateCourseGrade(courseId, studentId);
      setEditGrade(calculatedGrade.toString());
    } catch (err: any) {
      console.error('Error calculating grade:', err);
    } finally {
      setCalculating(false);
    }
  };

  // Save the edited grade
  const saveGrade = async () => {
    if (!selectedStudent) {
      setNotification({
        open: true,
        message: 'No student selected',
        severity: 'error'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // For pass/fail, normalize grade to 1 (pass) or 0 (fail)
      let normalizedGrade: number;
      
      if (gradingType === GradingType.PassFail) {
        if (editGrade === 'Pass') {
          normalizedGrade = 1;
        } else if (editGrade === 'Fail') {
          normalizedGrade = 0;
        } else {
          normalizedGrade = 0; // Default to fail if not specified
        }
      } else {
        // For numeric grades, ensure it's a valid number
        normalizedGrade = parseFloat(editGrade) || 0; // Use 0 as fallback if NaN
      }
      
      // Make sure all required fields have valid values
      const gradeData: SaveCourseGradeRequest = {
        courseId: courseId,
        studentId: selectedStudent.id,
        grade: normalizedGrade,
        feedback: editFeedback || '',
        isFinal: editIsFinal,
        gradingType: Number(gradingType) // Ensure it's a number
      };
      
      console.log('About to save grade data:', gradeData);
      
      // Validate data before sending
      if (!gradeData.studentId) {
        throw new Error('Student ID is missing');
      }
      
      await courseGradingService.saveCourseGrade(gradeData);
      await fetchGrades();
      handleCloseEditDialog();
      
      setNotification({
        open: true,
        message: 'Grade saved successfully',
        severity: 'success'
      });
      
      if (onGradeUpdated) {
        onGradeUpdated();
      }
    } catch (err: any) {
      console.error('Error saving grade:', err);
      
      // Show error to user
      let errorMessage = 'Failed to save grade';
      if (err.response && err.response.data && err.response.data.errors) {
        // Format validation errors
        const errors = err.response.data.errors;
        errorMessage = Object.keys(errors)
          .map(key => `${key}: ${errors[key].join(', ')}`)
          .join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchGrades();
  }, [courseId]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dialog handlers
  const handleOpenEditDialog = (student: { id: string, name: string }) => {
    setSelectedStudent(student);
    
    // Find existing grade data for this student
    const existingGrade = grades.find(g => g.studentId === student.id);
    
    if (existingGrade) {
      setEditGrade(existingGrade.grade.toString());
      setEditFeedback(existingGrade.feedback || '');
      setEditIsFinal(existingGrade.isFinal);
      setGradingType(existingGrade.gradingType);
    } else {
      setEditGrade('');
      setEditFeedback('');
      setEditIsFinal(false);
      setGradingType(GradingType.Numeric);
    }
    
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedStudent(null);
    setEditGrade('');
    setEditFeedback('');
    setEditIsFinal(false);
    setGradingType(GradingType.Numeric);
  };

  // Helper to find grade by student ID
  const getStudentGrade = (studentId: string) => {
    return grades.find(g => g.studentId === studentId);
  };

  // Render grade display based on grading type
  const renderGrade = (gradeData: CourseGrade | undefined) => {
    if (!gradeData) return '-';
    
    if (gradeData.gradingType === GradingType.PassFail) {
      return gradeData.passed ? (
        <Chip 
          icon={<CheckIcon />} 
          label="Pass" 
          color="success" 
          size="small" 
        />
      ) : (
        <Chip 
          icon={<CloseIcon />} 
          label="Fail" 
          color="error" 
          size="small" 
        />
      );
    } else {
      return gradeData.grade.toFixed(1);
    }
  };

  // Handle grade type change
  const handleGradeTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setGradingType(event.target.value as GradingType);
    setEditGrade('');
  };

  // Handle grade input change
  const handleGradeChange = (studentId: string, value: string | number) => {
    setEditGrade(value.toString());
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification((prev: NotificationState) => ({
      ...prev,
      open: false,
    }));
  };

  if (loading && grades.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={fetchGrades} sx={{ mt: 1 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell align="center">Grade</TableCell>
              <TableCell align="center">Graded By</TableCell>
              <TableCell align="center">Graded At</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((student) => {
                const gradeData = getStudentGrade(student.id);
                
                return (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell align="center">
                      {renderGrade(gradeData)}
                    </TableCell>
                    <TableCell align="center">
                      {gradeData ? gradeData.gradedByName : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {gradeData ? formatDate(gradeData.gradedAt) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {gradeData?.isFinal ? 
                        <Typography variant="body2" color="primary.main">Final</Typography> : 
                        <Typography variant="body2" color="text.secondary">Draft</Typography>
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Grade">
                        <IconButton 
                          onClick={() => handleOpenEditDialog(student)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={students.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Edit Grade Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Course Grade
          {selectedStudent && <Typography variant="subtitle1">{selectedStudent.name}</Typography>}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Grading Type Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Grading Type</FormLabel>
              <RadioGroup
                row
                value={gradingType}
                onChange={handleGradeTypeChange}
              >
                <FormControlLabel value={GradingType.Numeric} control={<Radio />} label="Grade 1-5" />
                <FormControlLabel value={GradingType.PassFail} control={<Radio />} label="Pass/Fail" />
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {gradingType === GradingType.Numeric ? (
                /* Numeric Grade Input */
                <TextField
                  label="Grade (0-5)"
                  type="number"
                  value={editGrade}
                  onChange={(e) => handleGradeChange(selectedStudent!.id, e.target.value)}
                  InputProps={{
                    inputProps: { min: 0, max: 5, step: 0.1 }
                  }}
                  fullWidth
                />
              ) : (
                /* Pass/Fail Selection */
                <FormControl fullWidth>
                  <FormLabel>Result</FormLabel>
                  <RadioGroup
                    row
                    value={editGrade}
                    onChange={(e) => handleGradeChange(selectedStudent!.id, e.target.value)}
                  >
                    <FormControlLabel value="Pass" control={<Radio />} label="Pass" />
                    <FormControlLabel value="Fail" control={<Radio />} label="Fail" />
                  </RadioGroup>
                </FormControl>
              )}
              
              {gradingType === GradingType.Numeric && (
                <Tooltip title="Calculate grade from assignments">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => selectedStudent && calculateGrade(selectedStudent.id)}
                    disabled={calculating}
                    startIcon={calculating ? <CircularProgress size={20} /> : <CalculateIcon />}
                  >
                    Calculate
                  </Button>
                </Tooltip>
              )}
            </Box>
            
            <TextField
              label="Feedback"
              multiline
              rows={4}
              value={editFeedback}
              onChange={(e) => setEditFeedback(e.target.value)}
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={editIsFinal}
                  onChange={(e) => setEditIsFinal(e.target.checked)}
                />
              }
              label="Mark as final grade"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={saveGrade}
            color="primary"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 