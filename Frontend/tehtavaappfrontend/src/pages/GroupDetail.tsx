import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { groupService, IStudent } from '../services/courses/groupService';
import { useAuthState } from '../hooks/useRedux';
import { PageHeader } from '../components/ui/PageHeader';
import { UserRole } from '../types';

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<IStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const groupDataRef = useRef<any>(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [studentEnrollments, setStudentEnrollments] = useState<Record<string, any>>({});

  const fetchStudentEnrollments = async (students: IStudent[]) => {
    if (!id || !students || students.length === 0) return;
    
    try {
      console.log('Haetaan ryhmän ilmoittautumistiedot');
      
      // Haetaan kaikki ryhmän ilmoittautumistiedot yhdellä kutsulla
      // GroupController.cs: [HttpGet("{id}/enrollments")]
      const enrollmentsData = await groupService.getGroupEnrollments(id);
      
      if (!enrollmentsData) {
        console.log('Ilmoittautumistietoja ei löytynyt');
        return;
      }
      
      console.log('Ryhmän ilmoittautumistiedot haettu:', enrollmentsData);
      
      // Muunnetaan taulukko objektiksi, jossa avaimena on opiskelijan ID
      const enrollments: Record<string, any> = {};
      
      enrollmentsData.forEach(enrollment => {
        if (enrollment.studentId) {
          enrollments[enrollment.studentId] = enrollment;
        }
      });
      
      console.log('Jäsennellyt ilmoittautumistiedot:', enrollments);
      setStudentEnrollments(enrollments);
    } catch (err) {
      console.error('Virhe ilmoittautumistietojen haussa:', err);
    }
  };

  useEffect(() => {
    // Älä lataa tietoja, jos käyttäjä on opiskelija
    if (user?.role === UserRole.Student) {
      return;
    }
    
    const fetchGroupData = async () => {
      if (!id) {
        console.error('Ryhmän ID puuttuu');
        setError('Ryhmän ID puuttuu');
        setLoading(false);
        return;
      }
      
      // Tarkistetaan, että ID on kelvollinen
      if (!/^[a-zA-Z0-9-]+$/.test(id) || id === 'create') {
        console.error('Virheellinen ryhmän ID:', id);
        setError('Virheellinen ryhmän ID');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Haetaan ryhmän tiedot, ID:', id, 'refreshTrigger:', refreshTrigger);
        const groupData = await groupService.getGroupById(id);
        console.log('Ryhmän tiedot haettu:', groupData);
        
        if (!groupData) {
          console.error('Ryhmän tietoja ei saatu');
          setError('Ryhmän tietoja ei löytynyt');
          setLoading(false);
          return;
        }
        
        setGroup(groupData);
        groupDataRef.current = groupData; // Tallennetaan viittaus ryhmän tietoihin
        
        // Haetaan opiskelijoiden ilmoittautumistiedot
        if (groupData.students && groupData.students.length > 0) {
          await fetchStudentEnrollments(groupData.students);
        } else if (groupData.studentEnrollments && groupData.studentEnrollments.length > 0) {
          // Jos students-kenttää ei ole, mutta studentEnrollments on, käytetään sitä
          console.log('Käytetään studentEnrollments-kenttää opiskelijoiden tietojen hakemiseen');
          
          // Muunnetaan studentEnrollments-taulukko objektiksi, jossa avaimena on opiskelijan ID
          const enrollments: Record<string, any> = {};
          
          groupData.studentEnrollments.forEach((enrollment: any) => {
            if (enrollment.studentId) {
              enrollments[enrollment.studentId] = enrollment;
            }
          });
          
          console.log('Jäsennellyt ilmoittautumistiedot:', enrollments);
          setStudentEnrollments(enrollments);
        }
      } catch (err: any) {
        console.error('Virhe ryhmän tietojen haussa:', err);
        
        // Tarkempi virheviesti
        let errorMessage = 'Ryhmän tietojen hakeminen epäonnistui. Yritä uudelleen.';
        if (err?.response?.status === 400) {
          errorMessage = 'Virheellinen pyyntö ryhmän tietojen haussa. Tarkista ryhmän ID.';
        } else if (err?.response?.status === 404) {
          errorMessage = 'Ryhmää ei löytynyt.';
        } else if (err?.message) {
          errorMessage = `Virhe: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [id, user, refreshTrigger]);

  const fetchAvailableStudents = async () => {
    if (!id) return;
    
    setLoadingStudents(true);
    
    try {
      const students = await groupService.getAvailableStudents(id);
      setAvailableStudents(students);
    } catch (err) {
      console.error('Virhe opiskelijoiden haussa:', err);
      setError('Opiskelijoiden hakeminen epäonnistui.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async () => {
    if (!id || !selectedStudentId) return;
    
    setAddingStudent(true);
    setError(null);
    
    try {
      console.log('Lisätään opiskelija ryhmään, ID:', selectedStudentId);
      const result = await groupService.addStudentToGroup(id, selectedStudentId);
      
      // Tarkistetaan, onko tulos boolean vai virheobjekti
      if (result === true) {
        console.log('Opiskelija lisätty onnistuneesti, päivitetään näkymä');
        
        // Haetaan opiskelijan tiedot saatavilla olevista opiskelijoista
        const addedStudent = availableStudents.find(s => s.id === selectedStudentId);
        console.log('Lisätty opiskelija:', addedStudent);
        
        if (addedStudent && groupDataRef.current) {
          // Lisätään opiskelija suoraan ryhmän tietoihin
          const updatedStudents = [...(groupDataRef.current.students || []), addedStudent];
          const updatedGroup = { ...groupDataRef.current, students: updatedStudents };
          console.log('Päivitetty ryhmä:', updatedGroup);
          
          // Päivitetään sekä ref että tila
          groupDataRef.current = updatedGroup;
          setGroup(updatedGroup);
          
          // Haetaan opiskelijan ilmoittautumistiedot
          try {
            const enrollment = await groupService.getStudentEnrollment(id, selectedStudentId);
            if (enrollment) {
              setStudentEnrollments(prev => ({
                ...prev,
                [selectedStudentId]: enrollment
              }));
            }
          } catch (err) {
            console.error(`Virhe opiskelijan ${selectedStudentId} ilmoittautumistietojen haussa:`, err);
          }
          
          // Pakottava päivitys: Haetaan ryhmän tiedot uudelleen palvelimelta
          setTimeout(async () => {
            try {
              console.log('Haetaan ryhmän tiedot uudelleen pakotetusti');
              const refreshedGroup = await groupService.getGroupById(id);
              console.log('Ryhmän tiedot haettu uudelleen:', refreshedGroup);
              setGroup(refreshedGroup);
              groupDataRef.current = refreshedGroup;
              
              // Haetaan opiskelijoiden ilmoittautumistiedot
              if (refreshedGroup.students && refreshedGroup.students.length > 0) {
                await fetchStudentEnrollments(refreshedGroup.students);
              }
              
              // Pakotetaan komponentin uudelleenrenderöinti
              forceUpdate();
              
              // Jos käyttöliittymä ei vieläkään päivity, ladataan sivu uudelleen
              // viimeisenä keinona
              if (!refreshedGroup.students?.some(s => s.id === selectedStudentId)) {
                console.log('Käyttöliittymä ei päivittynyt, ladataan sivu uudelleen');
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            } catch (err) {
              console.error('Virhe ryhmän tietojen uudelleenhaussa:', err);
            }
          }, 500);
        }
        
        // Päivitetään myös refreshTrigger varmuuden vuoksi
        setRefreshTrigger(prev => prev + 1);
        // Pakotetaan komponentin uudelleenrenderöinti
        forceUpdate();
        
        // Suljetaan dialogi
        setOpenAddDialog(false);
        setSelectedStudentId('');
      } else if (typeof result === 'object' && 'error' in result) {
        // Näytetään virheilmoitus
        console.error('Virhe opiskelijan lisäämisessä:', result.error);
        setError(`Opiskelijan lisääminen epäonnistui: ${result.error}`);
      } else {
        setError('Opiskelijan lisääminen epäonnistui. Yritä uudelleen.');
      }
    } catch (err) {
      console.error('Virhe opiskelijan lisäämisessä:', err);
      setError('Opiskelijan lisääminen epäonnistui. Yritä uudelleen.');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;
    
    setRemovingStudentId(studentId);
    setError(null);
    
    try {
      const result = await groupService.removeStudentFromGroup(id, studentId);
      
      // Tarkistetaan, onko tulos boolean vai virheobjekti
      if (result === true) {
        console.log('Opiskelija poistettu onnistuneesti, päivitetään näkymä');
        
        if (groupDataRef.current) {
          // Poistetaan opiskelija suoraan ryhmän tiedoista
          const updatedStudents = (groupDataRef.current.students || []).filter(
            (s: IStudent) => s.id !== studentId
          );
          const updatedGroup = { ...groupDataRef.current, students: updatedStudents };
          console.log('Päivitetty ryhmä:', updatedGroup);
          
          // Päivitetään sekä ref että tila
          groupDataRef.current = updatedGroup;
          setGroup(updatedGroup);
          
          // Poistetaan opiskelijan ilmoittautumistiedot
          setStudentEnrollments(prev => {
            const updated = { ...prev };
            delete updated[studentId];
            return updated;
          });
          
          // Pakottava päivitys: Haetaan ryhmän tiedot uudelleen palvelimelta
          setTimeout(async () => {
            try {
              console.log('Haetaan ryhmän tiedot uudelleen pakotetusti');
              const refreshedGroup = await groupService.getGroupById(id);
              console.log('Ryhmän tiedot haettu uudelleen:', refreshedGroup);
              setGroup(refreshedGroup);
              groupDataRef.current = refreshedGroup;
              
              // Haetaan opiskelijoiden ilmoittautumistiedot
              if (refreshedGroup.students && refreshedGroup.students.length > 0) {
                await fetchStudentEnrollments(refreshedGroup.students);
              }
              
              // Pakotetaan komponentin uudelleenrenderöinti
              forceUpdate();
              
              // Jos käyttöliittymä ei vieläkään päivity, ladataan sivu uudelleen
              // viimeisenä keinona
              if (refreshedGroup.students?.some(s => s.id === studentId)) {
                console.log('Käyttöliittymä ei päivittynyt, ladataan sivu uudelleen');
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            } catch (err) {
              console.error('Virhe ryhmän tietojen uudelleenhaussa:', err);
            }
          }, 500);
          
          // Pakotetaan komponentin uudelleenrenderöinti
          forceUpdate();
        }
        
        // Päivitetään myös refreshTrigger varmuuden vuoksi
        setRefreshTrigger(prev => prev + 1);
      } else if (typeof result === 'object' && 'error' in result) {
        // Näytetään virheilmoitus
        console.error('Virhe opiskelijan poistamisessa:', result.error);
        setError(`Opiskelijan poistaminen epäonnistui: ${result.error}`);
      } else {
        setError('Opiskelijan poistaminen epäonnistui. Yritä uudelleen.');
      }
    } catch (err) {
      console.error('Virhe opiskelijan poistamisessa:', err);
      setError('Opiskelijan poistaminen epäonnistui. Yritä uudelleen.');
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleImportStudents = async () => {
    if (!id || !csvFile) return;
    
    setImportError(null);
    setImportSuccess(false);
    
    try {
      // Check if the importStudentsFromCsv method exists in groupService
      if (typeof (groupService as any).importStudentsFromCsv === 'function') {
        const result = await (groupService as any).importStudentsFromCsv(id, csvFile);
        
        if (result.success) {
          // Päivitetään ryhmän tiedot laukaisemalla refreshTrigger
          setRefreshTrigger(prev => prev + 1);
          
          setImportSuccess(true);
          
          // Suljetaan dialogi pienen viiveen jälkeen
          setTimeout(() => {
            setOpenImportDialog(false);
            setCsvFile(null);
            setImportSuccess(false);
          }, 1500);
        } else {
          setImportError('Opiskelijoiden tuonti epäonnistui. Tarkista CSV-tiedosto ja yritä uudelleen.');
        }
      } else {
        // Fallback implementation if the method doesn't exist
        console.warn("importStudentsFromCsv method is not available in groupService. Using a manual fallback.");
        
        // Create a FormData object and append the file
        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('groupId', id);
        
        // Use the generic API to upload the file
        const response = await fetch(`/api/groups/${id}/import-students`, {
          method: 'POST',
          body: formData,
          headers: {
            // No Content-Type header needed for FormData
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          // Päivitetään ryhmän tiedot laukaisemalla refreshTrigger
          setRefreshTrigger(prev => prev + 1);
          
          setImportSuccess(true);
          
          // Suljetaan dialogi pienen viiveen jälkeen
          setTimeout(() => {
            setOpenImportDialog(false);
            setCsvFile(null);
            setImportSuccess(false);
          }, 1500);
        } else {
          setImportError('Opiskelijoiden tuonti epäonnistui. Tarkista CSV-tiedosto ja yritä uudelleen.');
        }
      }
    } catch (err) {
      console.error('Virhe opiskelijoiden tuonnissa:', err);
      setImportError('Opiskelijoiden tuonti epäonnistui. Tarkista CSV-tiedosto ja yritä uudelleen.');
    }
  };

  const handleOpenAddDialog = () => {
    fetchAvailableStudents();
    setOpenAddDialog(true);
  };

  const handleStudentChange = (event: SelectChangeEvent<string>) => {
    setSelectedStudentId(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCsvFile(event.target.files[0]);
    }
  };

  // Redirect students to dashboard
  if (user?.role === UserRole.Student) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !group) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/groups')} 
          sx={{ mt: 2 }}
        >
          Takaisin ryhmiin
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={group?.name || 'Ryhmän tiedot'}
        showBackButton={true}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ryhmän tiedot
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Nimi:</strong> {group?.name}
          </Typography>
          <Typography variant="body1">
            <strong>Kuvaus:</strong> {group?.description || 'Ei kuvausta'}
          </Typography>
          <Typography variant="body1">
            <strong>Opiskelijoita:</strong> {group?.students?.length || 0}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Opiskelijat
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setOpenImportDialog(true)}
              sx={{ mr: 1 }}
            >
              Tuo CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddDialog}
            >
              Lisää opiskelija
            </Button>
          </Box>
        </Box>
        
        {(!group?.students || group?.students?.length === 0) ? (
          <Alert severity="info">
            Tässä ryhmässä ei ole vielä opiskelijoita.
          </Alert>
        ) : (
          <Grid container spacing={2} key={`student-grid-${refreshTrigger}`}>
            {group?.students?.map((student: any) => {
              const enrollment = studentEnrollments[student.id] || {
                enrollmentDate: student.enrollmentDate
              };
              return (
                <Grid item xs={12} sm={6} md={4} key={`student-${student.id}-${refreshTrigger}`}>
                  <Card variant="outlined">
                    <CardContent sx={{ position: 'relative', pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" component="div">
                            {student.firstName} {student.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {student.email}
                          </Typography>
                          {enrollment && enrollment.enrollmentDate && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Ilmoittautunut:</strong> {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleRemoveStudent(student.id)}
                        disabled={removingStudentId === student.id}
                        sx={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8,
                          color: 'error.main'
                        }}
                      >
                        {removingStudentId === student.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
      
      {/* Lisää opiskelija -dialogi */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Lisää opiskelija ryhmään</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="student-select-label">Opiskelija</InputLabel>
            <Select
              labelId="student-select-label"
              id="student-select"
              value={selectedStudentId}
              label="Opiskelija"
              onChange={handleStudentChange}
              disabled={loadingStudents}
            >
              {loadingStudents ? (
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>
            Peruuta
          </Button>
          <Button 
            onClick={handleAddStudent} 
            variant="contained"
            disabled={!selectedStudentId || addingStudent}
            startIcon={addingStudent ? <CircularProgress size={20} /> : null}
          >
            {addingStudent ? 'Lisätään...' : 'Lisää'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* CSV-tuonti -dialogi */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)}>
        <DialogTitle>Tuo opiskelijoita CSV-tiedostosta</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Lataa CSV-tiedosto, jossa on opiskelijoiden tiedot. Tiedoston tulee sisältää sarakkeet: etunimi, sukunimi, sähköposti.
          </Typography>
          
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}
          
          {importSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Opiskelijat tuotu onnistuneesti!
            </Alert>
          )}
          
          <TextField
            type="file"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: '.csv' }}
            onChange={handleFileChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>
            Peruuta
          </Button>
          <Button 
            onClick={handleImportStudents} 
            variant="contained"
            disabled={!csvFile || importSuccess}
          >
            Tuo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupDetail;
