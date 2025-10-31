import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  CircularProgress,
  Typography,
  Grid,
  Divider
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Assignment } from '../../../types';
import { assignmentService, IAssignment } from '../../../services/assignments/assignmentService';
import MarkdownEditor from '../../common/MarkdownEditor';
import { useNavigate } from 'react-router-dom';

interface AssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreateAssignment: (data: any) => void;
  onAddExistingAssignments: (assignmentIds: string[]) => void;
}

const assignmentSchema = yup.object({
  title: yup.string().required('Otsikko on pakollinen'),
  description: yup.string().required('Kuvaus on pakollinen'),
  dueDate: yup.string().required('Määräaika on pakollinen'),
}).required();

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  open,
  onClose,
  courseId,
  onCreateAssignment,
  onAddExistingAssignments
}) => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState<'create' | 'existing'>('create');
  const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(assignmentSchema)
  });

  useEffect(() => {
    if (tabValue === 'existing' && open) {
      fetchAllAssignments();
    }
  }, [tabValue, open]);

  const fetchAllAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await assignmentService.getAssignments();
      
      const typedAssignments = assignmentsData.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        dueDate: assignment.dueDate || '',
        courseId: assignment.courseId || '',
        createdById: assignment.createdBy,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        points: assignment.points,
        status: 'Published'
      })) as Assignment[];
      
      setAvailableAssignments(typedAssignments);
    } catch (error) {
      console.error('Virhe haettaessa tehtäviä:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'create' | 'existing') => {
    setTabValue(newValue);
  };

  const handleAddExisting = () => {
    onAddExistingAssignments(selectedAssignmentIds);
    setSelectedAssignmentIds([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedAssignmentIds([]);
    setMarkdownContent('');
    reset();
    onClose();
  };

  const onSubmit = (data: any) => {
    const enrichedData = {
      ...data,
      contentMarkdown: markdownContent,
      courseId
    };
    console.log('Creating assignment:', enrichedData);
    onCreateAssignment(enrichedData);
    setMarkdownContent('');
    reset();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}
    >
      <DialogTitle>Lisää tehtävä kurssille</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 2 }}
        >
          <Tab value="create" label="Luo uusi" />
          <Tab value="existing" label="Käytä olemassa olevaa" />
        </Tabs>

        {tabValue === 'create' && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Otsikko"
                  {...register('title')}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Kuvaus"
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 2 }}>
                    Tehtävän sisältö (markdown)
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      handleClose();
                      navigate('/assignments/help');
                    }}
                    startIcon={<HelpOutline />}
                  >
                    Muotoiluohjeet
                  </Button>
                </Box>
                <MarkdownEditor
                  value={markdownContent}
                  onChange={setMarkdownContent}
                  courseId={courseId}
                  label=""
                  placeholder="Kirjoita tehtävän sisältö markdown-muodossa..."
                  minHeight={250}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Määräaika"
                  InputLabelProps={{ shrink: true }}
                  {...register('dueDate')}
                  error={!!errors.dueDate}
                  helperText={errors.dueDate?.message}
                />
              </Grid>
            </Grid>
          </form>
        )}

        {tabValue === 'existing' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Valitse olemassa olevat tehtävät lisättäväksi tälle kurssille
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="assignment-select-label">Tehtävät</InputLabel>
                  <Select
                    labelId="assignment-select-label"
                    multiple
                    value={selectedAssignmentIds}
                    onChange={(e) => setSelectedAssignmentIds(e.target.value as string[])}
                    input={<OutlinedInput label="Tehtävät" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((assignmentId) => {
                          const assignment = availableAssignments.find(a => a.id === assignmentId);
                          return (
                            <Chip 
                              key={assignmentId} 
                              label={assignment ? assignment.title : assignmentId} 
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {availableAssignments.map((assignment) => (
                      <MenuItem key={assignment.id} value={assignment.id}>
                        <Checkbox checked={selectedAssignmentIds.indexOf(assignment.id) > -1} />
                        <ListItemText primary={assignment.title} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Peruuta</Button>
        {tabValue === 'create' ? (
          <Button 
            onClick={handleSubmit(onSubmit)} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Tallenna'}
          </Button>
        ) : (
          <Button 
            onClick={handleAddExisting} 
            variant="contained" 
            color="primary"
            disabled={loading || selectedAssignmentIds.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Lisää valitut'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentDialog; 