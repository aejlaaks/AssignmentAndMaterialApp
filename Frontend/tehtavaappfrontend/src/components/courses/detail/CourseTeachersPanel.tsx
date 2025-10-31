import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { courseService } from '../../../services/courses/courseService';
import { getTeachers } from '../../../services/users/userService';
import { User } from '../../../types';

interface CourseTeachersPanelProps {
  courseId: string;
  mainTeacherId: string;
  canManage: boolean;
}

// Interface for teacher display
interface TeacherWithRole {
  id: string;
  name: string;
  email: string;
  isMainTeacher: boolean;
}

const CourseTeachersPanel: React.FC<CourseTeachersPanelProps> = ({ 
  courseId, 
  mainTeacherId,
  canManage 
}) => {
  const [teachers, setTeachers] = useState<TeacherWithRole[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch course teachers and available teachers
  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const courseTeachers = await courseService.getCourseTeachers(courseId);
      
      // Map to TeacherWithRole format
      const formattedTeachers: TeacherWithRole[] = courseTeachers.map((teacher: any) => ({
        id: teacher.id,
        name: teacher.firstName && teacher.lastName ? `${teacher.firstName} ${teacher.lastName}` : teacher.userName,
        email: teacher.email,
        isMainTeacher: teacher.id === mainTeacherId
      }));
      
      setTeachers(formattedTeachers);
    } catch (err) {
      console.error('Error fetching course teachers:', err);
      setError('Opettajien lataaminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const allTeachers = await getTeachers();
      
      // Filter out teachers who are already on the course
      const filtered = allTeachers.filter(
        teacher => !teachers.some(t => t.id === teacher.id)
      );
      
      setAvailableTeachers(filtered);
    } catch (err) {
      console.error('Error fetching available teachers:', err);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchTeachers();
  }, [courseId, mainTeacherId]);

  // When dialog opens, fetch available teachers
  const handleOpenDialog = () => {
    fetchAvailableTeachers();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeacherId('');
  };

  const handleTeacherSelect = (event: SelectChangeEvent<string>) => {
    setSelectedTeacherId(event.target.value);
  };

  // Add teacher to course
  const handleAddTeacher = async () => {
    if (!selectedTeacherId) return;
    
    setAddingTeacher(true);
    setError(null);
    
    try {
      const success = await courseService.addCourseTeacher(courseId, selectedTeacherId);
      if (success) {
        setSuccess('Opettaja lisätty kurssille');
        fetchTeachers(); // Refresh the list
        handleCloseDialog();
      } else {
        setError('Opettajan lisääminen epäonnistui');
      }
    } catch (err) {
      console.error('Error adding teacher:', err);
      setError('Opettajan lisääminen epäonnistui');
    } finally {
      setAddingTeacher(false);
    }
  };

  // Remove teacher from course
  const handleRemoveTeacher = async (teacherId: string) => {
    // Don't allow removing main teacher
    if (teacherId === mainTeacherId) {
      setError('Kurssin pääopettajaa ei voi poistaa');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await courseService.removeCourseTeacher(courseId, teacherId);
      if (success) {
        setSuccess('Opettaja poistettu kurssilta');
        // Update the list
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
      } else {
        setError('Opettajan poistaminen epäonnistui');
      }
    } catch (err) {
      console.error('Error removing teacher:', err);
      setError('Opettajan poistaminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Kurssin opettajat</Typography>
        
        {canManage && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            disabled={loading}
          >
            Lisää opettaja
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      ) : teachers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Ei lisättyjä opettajia
        </Typography>
      ) : (
        <List>
          {teachers.map((teacher) => (
            <React.Fragment key={teacher.id}>
              <ListItem>
                <ListItemText 
                  primary={teacher.name} 
                  secondary={
                    <>
                      {teacher.email}
                      {teacher.isMainTeacher && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="primary"
                          sx={{ display: 'block' }}
                        >
                          Kurssin pääopettaja
                        </Typography>
                      )}
                    </>
                  }
                />
                
                {canManage && !teacher.isMainTeacher && (
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveTeacher(teacher.id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Add Teacher Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Lisää opettaja kurssille</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            {availableTeachers.length === 0 ? (
              <Typography>Ei saatavilla olevia opettajia</Typography>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="teacher-select-label">Opettaja</InputLabel>
                <Select
                  labelId="teacher-select-label"
                  id="teacher-select"
                  value={selectedTeacherId}
                  label="Opettaja"
                  onChange={handleTeacherSelect}
                >
                  {availableTeachers.map(teacher => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName && teacher.lastName 
                        ? `${teacher.firstName} ${teacher.lastName}` 
                        : teacher.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Peruuta</Button>
          <Button 
            onClick={handleAddTeacher}
            disabled={!selectedTeacherId || addingTeacher}
            color="primary"
            variant="contained"
            startIcon={addingTeacher ? <CircularProgress size={20} /> : null}
          >
            Lisää
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CourseTeachersPanel; 