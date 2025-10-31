import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { groupService, IStudent } from '../services/courses/groupService';
import { getUsersByRole } from '../services/users/userService';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { UserRole } from '../types';

const groupSchema = yup.object({
  name: yup.string().required('Ryhmän nimi on pakollinen'),
  description: yup.string(),
}).required();

const GroupCreate: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<IStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(groupSchema)
  });

  // Haetaan saatavilla olevat opiskelijat
  useEffect(() => {
    // Vain jos käyttäjä ei ole opiskelija
    if (user?.role === UserRole.Student) {
      return;
    }
    
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        // Haetaan opiskelijat käyttäjäpalvelusta
        const students = await getUsersByRole(UserRole.Student);
        
        // Muotoillaan opiskelijat oikeaan muotoon
        const formattedStudents = students.map(student => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          role: student.role
        }));
        
        setAvailableStudents(formattedStudents);
        console.log('Haetut opiskelijat:', formattedStudents);
      } catch (error) {
        console.error('Virhe opiskelijoiden haussa:', error);
        setError('Opiskelijoiden hakeminen epäonnistui. Yritä uudelleen.');
        setAvailableStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    
    fetchStudents();
  }, [user]);

  const handleStudentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedStudentIds(typeof value === 'string' ? value.split(',') : value);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const groupData = {
        name: data.name,
        description: data.description || `Ryhmä: ${data.name}`
      };
      
      console.log('Luodaan ryhmä:', groupData);
      
      // Luodaan ryhmä
      const newGroup = await groupService.createGroup(groupData);
      console.log('Ryhmä luotu onnistuneesti:', newGroup);
      
      // Lisätään valitut opiskelijat ryhmään
      if (selectedStudentIds.length > 0 && newGroup.id) {
        console.log('Lisätään opiskelijat ryhmään:', selectedStudentIds);
        
        let addErrors = [];
        
        // Lisätään opiskelijat yksi kerrallaan
        for (const studentId of selectedStudentIds) {
          try {
            const result = await groupService.addStudentToGroup(newGroup.id, studentId);
            
            // Tarkistetaan vastaus
            if (typeof result === 'object' && 'success' in result && !result.success) {
              console.error(`Virhe lisättäessä opiskelijaa ${studentId}:`, result.error);
              addErrors.push(`Opiskelija (ID: ${studentId}): ${result.error}`);
            }
          } catch (err) {
            console.error(`Virhe lisättäessä opiskelijaa ${studentId}:`, err);
            addErrors.push(`Opiskelija (ID: ${studentId}): Tuntematon virhe`);
          }
        }
        
        if (addErrors.length > 0) {
          console.warn('Osa opiskelijoista ei voitu lisätä ryhmään:', addErrors);
          setError(`Ryhmä luotiin, mutta kaikkia opiskelijoita ei voitu lisätä: ${addErrors.join(', ')}`);
        } else {
          console.log('Opiskelijat lisätty ryhmään onnistuneesti');
        }
      }
      
      // Jos kurssi-ID on määritelty, lisätään ryhmä kurssiin
      if (courseId) {
        try {
          await groupService.addCourseToGroup(newGroup.id, courseId);
          console.log('Ryhmä lisätty kurssiin onnistuneesti');
        } catch (err) {
          console.error('Virhe lisättäessä ryhmää kurssiin:', err);
          setError(error ? `${error} Ryhmää ei voitu lisätä kurssiin.` : 'Ryhmää ei voitu lisätä kurssiin.');
        }
      }
      
      setSuccess(true);
      
      // Navigoidaan takaisin kurssin tietoihin tai ryhmäsivulle
      setTimeout(() => {
        if (courseId) {
          navigate(`/courses/${courseId}`);
        } else {
          navigate('/groups');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Virhe ryhmän luonnissa:', err);
      setError(err?.message || 'Ryhmän luonti epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate('/groups');
    }
  };

  // Redirect students to dashboard
  if (user?.role === UserRole.Student) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box>
      <PageHeader
        title="Luo uusi ryhmä"
        showBackButton={true}
      />
      
      <Paper sx={{ p: 3, mt: 3, maxWidth: 800, mx: 'auto' }}>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Ryhmä luotu onnistuneesti! Ohjataan eteenpäin...
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                margin="normal"
                fullWidth
                label="Ryhmän nimi"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isSubmitting}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Kuvaus"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={isSubmitting}
                multiline
                rows={3}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="students-select-label">Valitse opiskelijat</InputLabel>
                <Select
                  labelId="students-select-label"
                  id="students-select"
                  multiple
                  value={selectedStudentIds}
                  onChange={handleStudentChange}
                  input={<OutlinedInput label="Valitse opiskelijat" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const student = availableStudents.find(s => s.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={student ? student.name : value} 
                          />
                        );
                      })}
                    </Box>
                  )}
                  disabled={isSubmitting || isLoadingStudents}
                >
                  {isLoadingStudents ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Ladataan opiskelijoita...
                    </MenuItem>
                  ) : availableStudents.length === 0 ? (
                    <MenuItem disabled>
                      Ei saatavilla olevia opiskelijoita
                    </MenuItem>
                  ) : (
                    availableStudents.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  sx={{ mr: 1 }}
                >
                  Peruuta
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Luodaan...' : 'Luo ryhmä'}
                </Button>
              </Box>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GroupCreate;
