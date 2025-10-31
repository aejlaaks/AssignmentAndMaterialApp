import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { materialService } from '../services/materials/materialService';
import { courseService } from '../services/courses/courseService';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface Material {
  id: string;
  title: string;
  description?: string;
  type?: string;
  fileType?: string;
  courseId?: string;
  fileUrl?: string;
  courseName?: string;
  createdAt?: string;
}

interface CourseMap {
  [key: string]: string;
}

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseNames, setCourseNames] = useState<CourseMap>({});
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Function to get course names
  const fetchCourseNames = async () => {
    try {
      const courses = await courseService.getCourses();
      const courseMap: CourseMap = {};
      
      if (Array.isArray(courses)) {
        courses.forEach(course => {
          courseMap[course.id] = course.name || course.title || 'Unknown Course';
        });
      }
      
      return courseMap;
    } catch (error) {
      console.error('Error fetching course names:', error);
      return {};
    }
  };
  
  const loadMaterials = async (forceRefresh = false) => {
    try {
      setRefreshing(forceRefresh);
      setLoading(true);
      
      // Load all materials
      const result = await materialService.getAllMaterials(forceRefresh);
      console.log(`Loaded ${result.length} materials`);
      
      // Get course names
      const courseMap = await fetchCourseNames();
      setCourseNames(courseMap);
      
      // Map the materials to our local interface
      const mappedMaterials = result.map((material: any) => ({
        id: material.id,
        title: material.title || 'Untitled Material',
        description: material.description || '',
        type: material.type || 'file',
        fileType: material.fileType || '',
        courseId: material.courseId || '',
        fileUrl: material.fileUrl || '',
        courseName: material.courseId ? courseMap[material.courseId] || 'Unknown Course' : '',
        createdAt: material.createdAt || new Date().toISOString()
      }));
      
      setMaterials(mappedMaterials);
      setFilteredMaterials(mappedMaterials);
      setError(null);
    } catch (err) {
      console.error('Error loading materials:', err);
      setError('Failed to load materials. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadMaterials();
  }, []);
  
  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMaterials(materials);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = materials.filter(material => 
      material.title.toLowerCase().includes(term) || 
      (material.description && material.description.toLowerCase().includes(term)) ||
      (material.courseName && material.courseName.toLowerCase().includes(term))
    );
    
    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);
  
  const handleRefresh = () => {
    loadMaterials(true);
  };
  
  const handleMaterialClick = (id: string) => {
    navigate(`/material/${id}`);
  };
  
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FileIcon />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <PdfIcon color="error" />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) 
      return <ImageIcon color="primary" />;
    if (type.includes('video')) return <VideoIcon color="secondary" />;
    
    return <DescriptionIcon color="action" />;
  };
  
  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (err) {
      return '';
    }
  };
  
  const isTeacherOrAdmin = user?.role === UserRole.Teacher || user?.role === UserRole.Admin;
  
  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Materials" 
        action={
          isTeacherOrAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/courses')}
            >
              Add New Material
            </Button>
          )
        }
      />
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search materials..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Refresh materials">
                  <IconButton onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {error && <ErrorAlert message={error} />}
      
      {loading && materials.length === 0 ? (
        <LoadingSpinner />
      ) : filteredMaterials.length > 0 ? (
        <Grid container spacing={2}>
          {filteredMaterials.map(material => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={material.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6 
                  }
                }}
                onClick={() => handleMaterialClick(material.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ListItemIcon>
                      {getFileIcon(material.fileType)}
                    </ListItemIcon>
                    <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                      {material.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2, 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '40px'
                  }}>
                    {material.description || 'No description'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    {material.courseName && (
                      <Typography variant="caption" color="primary">
                        {material.courseName}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(material.createdAt)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No materials found
          </Typography>
          {searchTerm && (
            <Typography variant="body1" color="text.secondary">
              Try changing your search terms or clear the search
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default MaterialsPage; 