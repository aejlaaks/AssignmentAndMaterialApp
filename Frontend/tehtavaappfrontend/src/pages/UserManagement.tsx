import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, UserRole } from '../types';
import * as userService from '../services/users/userService';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// User form validation schema
const schema = yup.object({
  email: yup.string().email('Virheellinen sähköposti').required('Sähköposti on pakollinen'),
  firstName: yup.string().required('Etunimi on pakollinen'),
  lastName: yup.string().required('Sukunimi on pakollinen'),
  role: yup.string<UserRole>().required('Rooli on pakollinen'),
  password: yup.string().when('isNewUser', {
    is: true,
    then: (schema) => schema.min(6, 'Salasanan on oltava vähintään 6 merkkiä').required('Salasana on pakollinen'),
    otherwise: (schema) => schema.optional()
  }),
  isNewUser: yup.boolean()
}).required();

type UserFormData = yup.InferType<typeof schema>;

// Notification state type
type Notification = {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
} | null;

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;
  const isTeacher = user?.role === UserRole.Teacher;
  
  // State variables
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<Notification>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Form setup
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: UserRole.Student,
      password: '',
      isNewUser: true
    }
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      let fetchedUsers: User[];
      
      if (searchTerm) {
        fetchedUsers = await userService.searchUsers(searchTerm);
      } else {
        fetchedUsers = await userService.getUsers();
      }
      
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Virhe käyttäjien haussa:', err);
      setError('Käyttäjien hakeminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  // Open form dialog for add/edit
  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setValue('email', user.email);
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('role', user.role);
      setValue('isNewUser', false);
    } else {
      setSelectedUser(null);
      reset({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.Student,
        password: '',
        isNewUser: true
      });
    }
    setDialogOpen(true);
  };

  // Close form dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Submit user form
  const onSubmitUser = async (data: UserFormData) => {
    try {
      // If teacher is creating/editing a user, ensure the role is Student
      if (isTeacher && !isAdmin) {
        data.role = UserRole.Student;
      }
      
      if (selectedUser) {
        // Update existing user
        const { password, isNewUser, ...updateData } = data;
        await userService.updateUserProfile({ ...updateData, id: selectedUser.id });
        setNotification({ type: 'success', message: 'Käyttäjä päivitetty onnistuneesti' });
      } else {
        // Add new user
        await userService.createUser(data);
        setNotification({ type: 'success', message: 'Käyttäjä luotu onnistuneesti' });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error('Virhe käyttäjän tallennuksessa:', err);
      setNotification({ type: 'error', message: 'Käyttäjän tallennus epäonnistui' });
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (userId: string, isActive: boolean = true) => {
    try {
      if (isActive) {
        await userService.deactivateUser(userId);
        setNotification({ type: 'success', message: 'Käyttäjä deaktivoitu' });
      } else {
        await userService.reactivateUser(userId);
        setNotification({ type: 'success', message: 'Käyttäjä aktivoitu' });
      }
      fetchUsers();
    } catch (err) {
      console.error('Virhe käyttäjän tilan muutoksessa:', err);
      setNotification({ type: 'error', message: 'Käyttäjän tilan muutos epäonnistui' });
    }
  };

  // Delete user (only available to admin)
  const handleDeleteUser = async (userId: string) => {
    // Only allow admin to delete users
    if (!isAdmin) {
      setNotification({ type: 'error', message: 'Vain ylläpitäjä voi poistaa käyttäjiä' });
      return;
    }
    
    if (window.confirm('Haluatko varmasti deaktivoida tämän käyttäjän? Käyttäjä ei voi kirjautua sisään deaktivoinnin jälkeen.')) {
      try {
        await userService.deactivateUser(userId);
        setNotification({ type: 'success', message: 'Käyttäjä deaktivoitu onnistuneesti' });
        fetchUsers();
      } catch (err) {
        console.error('Virhe käyttäjän deaktivoinnissa:', err);
        setNotification({ type: 'error', message: 'Käyttäjän deaktivointi epäonnistui' });
      }
    }
  };

  // Change user role (only available to admin)
  const handleChangeRole = async (userId: string, newRole: string) => {
    // Only allow admin to change roles
    if (!isAdmin) {
      setNotification({ type: 'error', message: 'Vain ylläpitäjä voi muuttaa käyttäjärooleja' });
      return;
    }
    
    try {
      await userService.changeUserRole(userId, newRole);
      setNotification({ type: 'success', message: 'Käyttäjän rooli muutettu' });
      fetchUsers();
    } catch (err) {
      console.error('Virhe käyttäjän roolin muutoksessa:', err);
      setNotification({ type: 'error', message: 'Käyttäjän roolin muutos epäonnistui' });
    }
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <div className="page-container">
      <Typography variant="h4" gutterBottom>
        Käyttäjänhallinta
      </Typography>

      <Paper sx={{ width: '100%', mb: 4, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Hae käyttäjiä"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 1 }}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={() => fetchUsers()}
              color="primary"
            >
              Päivitä
            </Button>
          </Box>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Lisää käyttäjä
          </Button>
        </Box>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <>
            <TableContainer>
              <Table aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nimi</TableCell>
                    <TableCell>Sähköposti</TableCell>
                    <TableCell>Rooli</TableCell>
                    <TableCell>Tila</TableCell>
                    <TableCell align="right">Toiminnot</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={
                            user.role === UserRole.Admin 
                              ? 'error' 
                              : user.role === UserRole.Teacher 
                                ? 'primary' 
                                : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive !== false ? 'Aktiivinen' : 'Deaktivoitu'}
                          color={user.isActive !== false ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Muokkaa käyttäjää">
                          <IconButton 
                            onClick={() => handleOpenDialog(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.isActive ? "Deaktivoi" : "Aktivoi"}>
                          <IconButton 
                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                            color={user.isActive ? "warning" : "success"}
                          >
                            {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip title="Poista pysyvästi">
                            <IconButton 
                              onClick={() => handleDeleteUser(user.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rivejä per sivu:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
            />
          </>
        )}
      </Paper>

      {/* User add/edit dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmitUser)}>
          <DialogTitle>
            {selectedUser ? 'Muokkaa käyttäjää' : 'Lisää uusi käyttäjä'}
          </DialogTitle>
          <DialogContent>
            <TextField
              {...register('email')}
              margin="normal"
              fullWidth
              label="Sähköposti"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={!!selectedUser}
            />
            <TextField
              {...register('firstName')}
              margin="normal"
              fullWidth
              label="Etunimi"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              {...register('lastName')}
              margin="normal"
              fullWidth
              label="Sukunimi"
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <FormControl fullWidth margin="normal" error={!!errors.role}>
              <InputLabel>Rooli</InputLabel>
              <Select
                {...register('role')}
                label="Rooli"
                defaultValue={UserRole.Student}
                disabled={!isAdmin}
              >
                {isAdmin && <MenuItem value={UserRole.Admin}>Ylläpitäjä</MenuItem>}
                {isAdmin && <MenuItem value={UserRole.Teacher}>Opettaja</MenuItem>}
                <MenuItem value={UserRole.Student}>Opiskelija</MenuItem>
              </Select>
              {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
              {isTeacher && !isAdmin && (
                <FormHelperText>Opettajat voivat lisätä vain opiskelijoita</FormHelperText>
              )}
            </FormControl>
            {!selectedUser && (
              <TextField
                {...register('password')}
                margin="normal"
                fullWidth
                label="Salasana"
                type="password"
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
            <input type="hidden" {...register('isNewUser')} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Peruuta</Button>
            <Button type="submit" variant="contained">
              {selectedUser ? 'Tallenna' : 'Lisää'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Notifications */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification?.type || 'info'} 
          sx={{ width: '100%' }}
        >
          {notification?.message || ''}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UserManagement; 