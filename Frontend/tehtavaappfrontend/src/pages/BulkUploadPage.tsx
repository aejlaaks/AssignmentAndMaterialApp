import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import BulkAssignmentUpload from '../components/assignments/BulkAssignmentUpload';
import BulkMaterialUpload from '../components/materials/BulkMaterialUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bulk-upload-tabpanel-${index}`}
      aria-labelledby={`bulk-upload-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `bulk-upload-tab-${index}`,
    'aria-controls': `bulk-upload-tabpanel-${index}`,
  };
}

const BulkUploadPage: React.FC = () => {
  // Get courseId from both URL params and query params
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse courseId from query params
  const queryParams = new URLSearchParams(location.search);
  const queryCourseId = queryParams.get('courseId');
  
  // Use the courseId from params if available, otherwise from query
  const courseId = paramCourseId || queryCourseId || '';
  
  const [tabValue, setTabValue] = useState(0);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  useEffect(() => {
    // Log for debugging
    console.log('BulkUploadPage mounted with courseId:', courseId);
    console.log('- from params:', paramCourseId);
    console.log('- from query:', queryCourseId);
    
    if (!courseId) {
      console.error('No courseId provided to BulkUploadPage');
    }
  }, [courseId, paramCourseId, queryCourseId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    // Navigate back to course page with refresh data state to trigger refresh
    navigate(`/courses/${courseId}`, {
      state: {
        refreshData: true,
        uploadType: tabValue === 0 ? 'Assignments' : 'Materials'
      }
    });
  };

  const handleUploadComplete = useCallback(() => {
    const uploadType = tabValue === 0 ? 'Assignments' : 'Materials';
    setSuccessNotification(uploadType);
    
    // Navigate back to course page after a short delay
    // Add a state parameter to indicate that a refresh is needed
    setTimeout(() => {
      navigate(`/courses/${courseId}`, { 
        state: { 
          refreshData: true,
          uploadType: uploadType
        } 
      });
    }, 1500);
  }, [tabValue, navigate, courseId]);

  const handleCloseNotification = () => {
    setSuccessNotification(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Snackbar 
        open={!!successNotification} 
        autoHideDuration={3000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseNotification}>
          {successNotification} uploaded successfully! Redirecting to course page...
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Bulk Upload
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="bulk upload tabs"
          >
            <Tab label="Assignments" {...a11yProps(0)} />
            <Tab label="Materials" {...a11yProps(1)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <BulkAssignmentUpload courseId={courseId} onComplete={handleUploadComplete} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <BulkMaterialUpload courseId={courseId} onComplete={handleUploadComplete} />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BulkUploadPage; 