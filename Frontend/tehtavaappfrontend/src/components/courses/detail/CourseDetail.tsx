import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Tab, 
  Tabs, 
  Button, 
  CircularProgress,
  Paper
} from '@mui/material';
import { ArrowBack, Edit, Delete, Grading, Upload } from '@mui/icons-material';

import { useCourseTabs } from '../../../hooks/useCourseTabs';
import { useCourseDialogs } from '../../../hooks/useCourseDialogs';
import { useCourseOperations } from '../../../hooks/useCourseOperations';
import { useCourseStore } from '../../../hooks/useCourseStore';
import { useUserStore } from '../../../hooks/useUserStore';
import { Course } from '../../../types/CourseTypes';
import { UserRole } from '../../../types';

import TabPanel from './TabPanel';
import { a11yProps } from './a11yHelpers';
import InfoTab from './tabs/InfoTab';
import MaterialsTab from './tabs/MaterialsTab';
import TasksTab from './tabs/TasksTab';
import GradesTab from './tabs/GradesTab';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { CourseEditDialog } from '../../courses/dialogs';

console.log('=== COURSE DETAIL COMPONENT LOADED ===');

/**
 * Course detail page component with tabs
 * Shows different aspects of a course based on selected tab
 */
const CourseDetail: React.FC = () => {
  console.log('CourseDetail component rendering');
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data and state management hooks
  const { fetchCourseById, course, loading, updateCourse } = useCourseStore();
  const { user } = useUserStore();
  const { tabValue, handleTabChange, setTabValue } = useCourseTabs();
  
  // Add debug state
  const [debugRender, setDebugRender] = useState(false);
  
  // Get dialog state from useCourseDialogs hook
  const { 
    deleteDialogOpen,
    setDeleteDialogOpen,
    courseEditDialogOpen,
    setCourseEditDialogOpen,
  } = useCourseDialogs();
  
  // Initialize the course operations with the courseId
  const { handleDeleteCourse } = useCourseOperations(courseId);

  // For debugging course data
  console.log('Course ID:', courseId);
  console.log('Full course data:', course);
  console.log('Course loading state:', loading);

  // Improved user role and ownership check
  const normalizedUserRole = user?.role?.toLowerCase();
  
  // Explicit ownership check with detailed logging
  const isCreator = !!course && !!user && course?.createdById === user?.id;
  const isTeacherOfCourse = !!course && !!user && course?.teacherId === user?.id;
  const hasTeacherRole = normalizedUserRole === 'teacher';
  const hasAdminRole = normalizedUserRole === 'admin';
  
  const isOwner = isCreator || isTeacherOfCourse || hasTeacherRole || hasAdminRole;
  
  // Debug isOwner calculation
  console.log('Ownership calculation:', {
    isCreator,
    isTeacherOfCourse,
    hasTeacherRole,
    hasAdminRole,
    courseCreatedById: course?.createdById,
    courseTeacherId: course?.teacherId,
    userId: user?.id,
    userRole: normalizedUserRole,
    isOwnerResult: isOwner
  });

  const isTeacher = hasTeacherRole || hasAdminRole;

  // Add a useEffect for component lifecycle logging
  useEffect(() => {
    console.log('CourseDetail mounted with courseId:', courseId);
    // Enable debug rendering
    setDebugRender(true);
    return () => console.log('CourseDetail unmounted');
  }, [courseId]);

  // For debugging
  console.log('User:', user);
  console.log('User role:', user?.role);
  console.log('Is teacher or admin:', isTeacher);
  console.log('Current tab value:', tabValue);
  console.log('Current location:', location.pathname);

  // Handle direct navigation to the grades tab
  useEffect(() => {
    if (location.pathname.includes('/grades') && isTeacher) {
      setTabValue(4); // Set to grades tab
    }
  }, [location.pathname, isTeacher, setTabValue]);

  // Fetch course data when component mounts or courseId changes
  useEffect(() => {
    const loadCourse = async () => {
      console.log('Loading course data for ID:', courseId);
      if (courseId) {
        try {
          await fetchCourseById(courseId);
          console.log('Course data loaded successfully');
        } catch (error) {
          console.error('Failed to load course data:', error);
        }
      }
    };
    loadCourse();
  }, [courseId, fetchCourseById]);

  // Debug course and user data
  useEffect(() => {
    console.log('Course data updated:', {
      course,
      user,
      isOwner,
      isTeacher,
      loading
    });
  }, [course, user, isOwner, isTeacher, loading]);

  // Handle course deletion with cleanup
  const handleDelete = async () => {
    try {
      await handleDeleteCourse(true);
      // If we get here, the deletion was successful
      navigate('/courses');
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Return to courses list
  const handleBack = () => {
    navigate('/courses');
  };

  /**
   * Handles successful course update
   */
  const handleCourseUpdateSuccess = (updatedCourse: Course) => {
    console.log('Course updated successfully:', updatedCourse);
    updateCourse(updatedCourse);
    
    // Update UI to reflect changes
    setCourseEditDialogOpen(false);
  };
 
  // Navigate to grades tab
  const handleViewGrades = () => {
    setTabValue(4); // Set to grades tab (0-indexed, so 4 is the 5th tab)
    navigate(`/courses/${courseId}?tab=grades`);
  };

  // Navigate to the bulk upload page
  const handleBulkUploadClick = () => {
    console.log('Navigating to bulk upload page for course:', courseId);
    navigate(`/bulk-upload?courseId=${courseId}`);
  };
  
  // Add debug render function
  const renderDebugInfo = () => (
    <div style={{ margin: '20px', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
      <h3>Debug Info</h3>
      <pre>{JSON.stringify({
        courseId,
        courseTitle: course?.title,
        userId: user?.id,
        userRole: user?.role,
        isOwner,
        isTeacher,
        renderingConditionalButtons: isOwner
      }, null, 2)}</pre>
    </div>
  );

  if (loading) {
    return <CircularProgress />;
  }

  console.log('About to render action buttons, isOwner:', isOwner, 'user:', user?.id, 'course creator:', course?.createdById, 'course teacher:', course?.teacherId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {debugRender && renderDebugInfo()}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            variant="outlined"
          >
            Back to Courses
          </Button>
          <Typography variant="h4" component="h1">
            {course?.title || 'Loading...'}
          </Typography>
        </Box>
        
        {/* Always show this debug button */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Upload />}
            onClick={handleBulkUploadClick}
            variant="contained"
            color="primary"
            data-testid="debug-bulk-upload"
          >
            Debug Bulk Upload
          </Button>
        </Box>
        
        {/* Original conditional buttons */}
        {isOwner && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Upload />}
              onClick={handleBulkUploadClick}
              variant="contained"
              color="primary"
              data-testid="bulk-upload"
            >
              Bulk Upload
            </Button>
            <Button
              startIcon={<Edit />}
              onClick={() => setCourseEditDialogOpen(true)}
              variant="outlined"
            >
              Edit Course
            </Button>
            <Button
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
              variant="outlined"
              color="error"
            >
              Delete Course
            </Button>
          </Box>
        )}
      </Box>

      {/* Course tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="course tabs">
          <Tab label="Tiedot" {...a11yProps(0)} />
          <Tab label="Materiaalit" {...a11yProps(1)} />
          <Tab label="Tehtävät" {...a11yProps(2)} />
          <Tab label="Ryhmät" {...a11yProps(3)} />
          {isTeacher && <Tab label="Arvosanat" {...a11yProps(4)} />}
        </Tabs>
      </Box>

      {/* Tab content */}
      <TabPanel value={tabValue} index={0}>
        <InfoTab course={course || { id: '', title: '', description: '', createdAt: new Date() }} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <MaterialsTab courseId={courseId} isOwner={isOwner} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <TasksTab courseId={courseId} isOwner={isOwner} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <Typography variant="body1">Group content here</Typography>
      </TabPanel>
      {isTeacher && (
        <TabPanel value={tabValue} index={4}>
          <GradesTab courseId={courseId} isOwner={isOwner} />
        </TabPanel>
      )}

      {/* Dialogs */}
      <CourseEditDialog
        open={courseEditDialogOpen}
        onClose={() => setCourseEditDialogOpen(false)}
        course={course || { id: '', title: '', description: '', createdAt: new Date() }}
        onUpdateSuccess={handleCourseUpdateSuccess}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Course"
        content="Are you sure you want to delete this course? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  );
};

export default CourseDetail; 