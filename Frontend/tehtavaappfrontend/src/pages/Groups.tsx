import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { groupService } from '../services/courses/groupService';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { UserRole } from '../types';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Älä lataa tietoja, jos käyttäjä on opiskelija
    if (user?.role === UserRole.Student) {
      return;
    }
    
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await groupService.getGroups();
        setGroups(data);
      } catch (err) {
        console.error('Virhe ryhmien haussa:', err);
        setError('Ryhmien hakeminen epäonnistui. Yritä uudelleen.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [user]);

  const handleCreateGroup = () => {
    navigate('/groups/create');
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  // Suodata ryhmät hakutermin perusteella
  const filteredGroups = searchTerm
    ? groups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    : groups;

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

  return (
    <Box>
      <PageHeader
        title="Ryhmät"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
          >
            Luo uusi ryhmä
          </Button>
        }
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Hae ryhmiä..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {filteredGroups.length === 0 ? (
        <Alert severity="info">
          {searchTerm 
            ? 'Hakuehdoilla ei löytynyt ryhmiä.' 
            : 'Ei ryhmiä. Luo uusi ryhmä aloittaaksesi.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredGroups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleGroupClick(group.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" component="div" noWrap>
                      {group.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      height: '40px'
                    }}
                  >
                    {group.description || 'Ei kuvausta'}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Tooltip title="Opiskelijoita">
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {group.students?.length || 0}
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="Kursseja">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {group.courseCount || 0}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Näytä tiedot
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Groups;
