import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper, Typography, TextField, Button, Alert, Link, Grid } from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/slices/authSlice';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Get the return URL from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const resultAction = await dispatch(login({ email, password }));
      
      if (login.fulfilled.match(resultAction)) {
        // Navigate to the page user was trying to access or to dashboard
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 3,
      backgroundColor: 'grey.100'
    }}>
      <Paper elevation={3} sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 400,
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Kirjaudu sisään
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Sähköposti"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          
          <TextField
            label="Salasana"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </Button>
          
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Unohditko salasanan?
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};
