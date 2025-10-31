import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  OutlinedInput,
  CircularProgress,
  DialogContentText,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Container,
  ButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMaterial,
  updateMaterial,
  fetchMaterialsSuccess,
  addAssignment,
  fetchAssignmentsSuccess,
  setCurrentCourse,
  addSchoolGroup,
  fetchSchoolGroupsSuccess,
  updateSchoolGroup,
  deleteSchoolGroup,
} from '../store/slices/courseSlice';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { groupService } from '../services/courses/groupService';
import { assignmentService } from '../services/assignments/assignmentService';
import { materialService } from '../services/materials/materialService';
import { courseService } from '../services/courses/courseService';
import { useAuthState } from '../hooks/useRedux';
import { UserRole, Assignment, SchoolGroup } from '../types';
import { IStudent } from '../services/courses/groupService';
import MaterialList from '@/components/materials/MaterialList';
import MaterialUpload from '@/components/materials/MaterialUpload';
import GroupForm from '@/components/forms/GroupForm';
import { PageHeader } from '../components/ui/PageHeader';
import { responsiveClasses } from '../utils/responsiveUtils';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { 
  CourseInfoPanel, 
  MaterialsTab, 
  AssignmentsTab, 
  GroupsTab 
} from '../components/courses/detail';
import { 
  MaterialDialog, 
  AssignmentDialog, 
  GroupDialog, 
  StudentsDialog 
} from '../components/courses/dialogs';
import CourseTeachersPanel from '../components/courses/detail/CourseTeachersPanel';
import CourseTeachersViewPanel from '../components/courses/detail/CourseTeachersViewPanel';
import { RootState } from '../store';
import { mapLegacyGroupToRedux, mapLegacyGroupsToRedux } from '../utils/typeMappers';
import { Assignment as IndexAssignment } from '../types/index';
import { Assignment as AssignmentType } from '../types/assignment';
import { StudentStatsDashboard } from '../components/student';
import GradesTab from '../components/courses/detail/tabs/GradesTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      sx={{ py: 3 }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
};

const materialSchema = yup.object({
  title: yup.string().required('Otsikko on pakollinen'),
  content: yup.string().required('Sisältö on pakollinen'),
}).required();

const assignmentSchema = yup.object({
  title: yup.string().required('Otsikko on pakollinen'),
  description: yup.string().required('Kuvaus on pakollinen'),
  dueDate: yup.string().required('Määräaika on pakollinen'),
}).required();

const groupSchema = yup.object({
  name: yup.string().required('Ryhmän nimi on pakollinen'),
  description: yup.string(),
}).required();

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'material' | 'assignment' | 'group'>('material');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialDialogTab, setMaterialDialogTab] = useState<'upload' | 'existing'>('upload');
  const [assignmentDialogTab, setAssignmentDialogTab] = useState<'create' | 'existing'>('create');
  const [groupDialogTab, setGroupDialogTab] = useState<'create' | 'existing'>('create');
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<IndexAssignment[]>([]);
  const [availableGroups, setAvailableGroups] = useState<SchoolGroup[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cleanupBeforeDelete, setCleanupBeforeDelete] = useState(true);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SchoolGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [availableStudents, setAvailableStudents] = useState<IStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  
  const {
    courseMaterials,
    loading: courseDetailLoading,
    error: courseDetailError,
    currentCourse,
    assignments,
    schoolGroups,
    canManage,
  } = useCourseDetail(id);

  // Ensure canManage is properly typed as boolean for component props
  const isUserCanManage: boolean = Boolean(canManage);
  
  // Make sure currentCourse properties are accessed safely
  const courseData = currentCourse || { name: '', teacherId: '' };

  const courseAssignments = assignments;
  const courseGroups = schoolGroups;

  const materialForm = useForm({
    resolver: yupResolver(materialSchema)
  });

  const assignmentForm = useForm({
    resolver: yupResolver(assignmentSchema)
  });

  const groupForm = useForm({
    resolver: yupResolver(groupSchema)
  });

  const { user } = useAuthState();
  
  // Enhanced role detection with logging
  const userRoleStr = String(user?.role || '').toLowerCase();
  console.log('User role information:', {
    originalRole: user?.role,
    normalizedRole: userRoleStr,
    userObject: user
  });
  
  const isStudent = userRoleStr === 'student';
  const isTeacher = userRoleStr === 'teacher' || userRoleStr === 'admin';

  // Ensure student view for students - with improved redirect logic and loop prevention
  useEffect(() => {
    // Only redirect if we have both a user role and course ID
    if (isStudent && id && user) {
      console.log('Student detected, redirecting to student course view:', {
        role: user.role,
        courseId: id,
        normalizedRole: userRoleStr
      });

      // Prevent redirect loop by checking URL
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/student-courses/')) {
        console.log('Redirecting from', currentPath, 'to', `/student-courses/${id}`);
        navigate(`/student-courses/${id}`);
      } else {
        console.log('Already on student course view, not redirecting');
      }
    }
  }, [isStudent, id, navigate, user]);

  // Prevent teachers/admins going to student view
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (isTeacher && currentPath.includes('/student-courses/')) {
      console.log('Teacher detected on student view, redirecting to course detail');
      navigate(`/courses/${id}`);
    }
  }, [isTeacher, id, navigate]);

  useEffect(() => {
    if (id) {
      // Initial data fetch
      fetchInitialData();
    }
  }, [id]);

  // Add useEffect to refresh materials when returning to this page
  useEffect(() => {
    // This will refresh the materials list every time the component becomes visible
    // after navigating back from another page (like the bulk upload page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        console.log('Page became visible, refreshing materials for course:', id);
        refreshCourseMaterials();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when the component mounts/remounts
    if (id) {
      console.log('CourseDetail mounted, refreshing materials for course:', id);
      refreshCourseMaterials();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]); // Only re-run when the course ID changes

  // Check for tab parameter in URL on initial load
  useEffect(() => {
    // Get the tab parameter from the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    // If tab parameter exists, set the appropriate tab
    if (tabParam === 'grades' && isUserCanManage) {
      setTabValue(GRADES_TAB);
    }
  }, [location.search, isUserCanManage]);

  // Function to refresh course materials
  const refreshCourseMaterials = async () => {
    try {
      console.log(`Refreshing materials for course ${id}...`);
      // Force refresh from API by setting forceRefresh to true
      const materialsResponse = await materialService.getMaterials(id, true);
      console.log('API returned materials:', materialsResponse);
      
      // Just use the response directly and cast it to any to avoid type issues
      dispatch(fetchMaterialsSuccess(materialsResponse as any[]));
      console.log(`Successfully refreshed ${materialsResponse.length} materials for course ${id}`);
      
      // Show success notification for manual refreshes
      showSnackbar(`Materials refreshed successfully (${materialsResponse.length} found)`, 'success');
    } catch (error) {
      console.error('Error refreshing course materials:', error);
      showSnackbar('Failed to refresh materials', 'error');
    }
  };

  // Function to show snackbar notifications
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Now add the useEffect for navigation state refresh AFTER these functions are defined
  // Check for refresh flag in navigation state (when returning from BulkUploadPage)
  useEffect(() => {
    if (location.state && (location.state as any).refreshData) {
      const uploadType = (location.state as any).uploadType;
      console.log(`Detected return from upload page with ${uploadType} uploaded, refreshing data...`);
      
      // Refresh the appropriate data based on what was uploaded
      if (uploadType === 'Materials') {
        refreshCourseMaterials();
      } else if (uploadType === 'Assignments') {
        // Refresh assignments (similar to refreshCourseMaterials but for assignments)
        (async () => {
          try {
            const refreshedAssignments = await assignmentService.getAssignmentsByCourse(id!);
            dispatch(fetchAssignmentsSuccess(refreshedAssignments.map((a: any) => ({
              ...a,
              description: a.description || '',
              dueDate: a.dueDate || '',
              courseId: a.courseId || '',
              createdAt: a.createdAt || '',
              status: '',
              relatedMaterials: []
            }))));
          } catch (error) {
            console.error('Error refreshing assignments:', error);
          }
        })();
      }
      
      // Show success notification
      showSnackbar(`${uploadType} have been uploaded successfully!`, 'success');
      
      // Clear the state to prevent repeated refreshes
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, id, assignmentService, dispatch]);

  // Fetch initial course data including groups
  const fetchInitialData = async () => {
    try {
      // Main course data fetching
      const courseResponse = await courseService.getCourseById(id!);
      dispatch(setCurrentCourse(courseResponse));
      
      // Fetch course materials - explicitly passing courseId and forcing refresh
      console.log(`Fetching materials for course ${id}...`);
      const materialsResponse = await materialService.getMaterials(id, true);
      console.log('API returned materials:', materialsResponse);
      
      // Use the response directly - backend should already filter by courseId
      dispatch(fetchMaterialsSuccess(materialsResponse as any[]));
      console.log('Updated Redux state with materials:', materialsResponse);
      
      // Fetch all available materials for "add existing" function
      const allMaterials = await materialService.getAllMaterials(true);
      console.log('All materials retrieved:', allMaterials);
      
      // Ensure allMaterials is an array before using filter
      if (Array.isArray(allMaterials)) {
        setAvailableMaterials(allMaterials.filter((m: any) => m.courseId !== id));
      } else {
        console.error('getAllMaterials did not return an array:', allMaterials);
        setAvailableMaterials([]);
      }
      
      // Fetch course assignments
      const assignmentsResponse = await assignmentService.getAssignmentsByCourse(id!);
      dispatch(fetchAssignmentsSuccess(assignmentsResponse.map((a: any) => ({
        ...a,
        description: a.description || '',
        dueDate: a.dueDate || '',
        courseId: a.courseId || '',
        createdAt: a.createdAt || '',
        status: '',
        relatedMaterials: []
      }))));
      
      // Fetch course groups - explicitly fetch groups for this course
      await fetchCourseGroups();
      
      setContentLoaded(true);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load course data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Dedicated function to fetch and update groups for the current course
  const fetchCourseGroups = async () => {
    try {
      console.log(`Fetching groups for course ${id}...`);
      const groups = await groupService.getGroupsByCourse(id!);
      console.log(`Retrieved ${groups.length} groups for course ${id}:`, groups);
      
      // Convert ISchoolGroup[] to SchoolGroup[] using our mapper
      const mappedGroups = mapLegacyGroupsToRedux(groups);
      
      dispatch(fetchSchoolGroupsSuccess(mappedGroups));
      return mappedGroups;
    } catch (error) {
      console.error(`Error fetching groups for course ${id}:`, error);
      return [];
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Just set the tab value directly without any special case for grades
    setTabValue(newValue);
  };

  const handleOpenDialog = (type: 'material' | 'assignment' | 'group') => {
    setDialogType(type);
    setDialogOpen(true);
    
    if (type === 'material' && materialDialogTab === 'existing') {
      fetchAllMaterials();
    }
    
    if (type === 'assignment' && assignmentDialogTab === 'existing') {
      fetchAllAssignments();
    }
    
    if (type === 'group' && groupDialogTab === 'existing') {
      fetchAllGroups();
    }
  };
  
  const fetchAllGroups = async () => {
    try {
      setLoadingGroups(true);
      const allGroups = await groupService.getGroups();
      console.log('All available groups:', allGroups);
      
      // Convert ISchoolGroup[] to SchoolGroup[] using our mapper
      const mappedGroups = mapLegacyGroupsToRedux(allGroups);
      
      // Filter out groups that are already in this course
      const filteredGroups = mappedGroups.filter(g => g.courseId !== id);
      
      setAvailableGroups(filteredGroups);
      return filteredGroups;
    } catch (error) {
      console.error('Error fetching available groups:', error);
      return [];
    } finally {
      setLoadingGroups(false);
    }
  };
  
  const fetchAllAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const allAssignments = await assignmentService.getAssignments();
      const filteredAssignments = allAssignments.filter(a => a.courseId !== id);
      setAvailableAssignments(filteredAssignments.map((a: any) => ({
        ...a,
        description: a.description || '',
        dueDate: a.dueDate || '',
        courseId: a.courseId || '',
        createdAt: a.createdAt || '',
        status: '',
        relatedMaterials: []
      })));
    } catch (error) {
      console.error('Error fetching all assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };
  
  const fetchAllMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const materials = await materialService.getAllMaterials();
      console.log('fetchAllMaterials result:', materials);
      
      // Ensure materials is an array before filtering
      if (Array.isArray(materials)) {
        const filteredMaterials = materials.filter((m: any) => m.courseId !== id);
        setAvailableMaterials(filteredMaterials);
      } else {
        console.error('getAllMaterials did not return an array:', materials);
        setAvailableMaterials([]);
      }
    } catch (error) {
      console.error('Error fetching all materials:', error);
      setAvailableMaterials([]); // Set empty array on error
    } finally {
      setLoadingMaterials(false);
    }
  };
  
  useEffect(() => {
    if (dialogOpen && dialogType === 'material' && materialDialogTab === 'existing') {
      fetchAllMaterials();
    }
  }, [materialDialogTab, dialogOpen, dialogType]);
  
  useEffect(() => {
    if (dialogOpen && dialogType === 'assignment' && assignmentDialogTab === 'existing') {
      fetchAllAssignments();
    }
  }, [assignmentDialogTab, dialogOpen, dialogType]);
  
  useEffect(() => {
    if (dialogOpen && dialogType === 'group' && groupDialogTab === 'existing') {
      fetchAllGroups();
    }
  }, [groupDialogTab, dialogOpen, dialogType]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    materialForm.reset();
    assignmentForm.reset();
    groupForm.reset();
  };

  const handleDeleteCourse = async () => {
    setDeleteLoading(true);
    try {
      // If cleanup is enabled, try to remove dependencies first
      if (cleanupBeforeDelete) {
        setCleanupInProgress(true);
        try {
          showSnackbar('Valmistellaan kurssia poistoa varten...', 'success');
          await courseService.cleanupCourseForDeletion(id!);
          showSnackbar('Kurssin sisältö poistettu onnistuneesti', 'success');
        } catch (cleanupError) {
          console.error('Virhe valmistellessa kurssia poistoa varten:', cleanupError);
          showSnackbar('Kurssin valmistelu poistoa varten epäonnistui, yritetään poistaa suoraan', 'error');
        } finally {
          setCleanupInProgress(false);
        }
      }
      
      // Continue with course deletion
      await courseService.deleteCourse(id!);
      showSnackbar('Kurssi poistettu onnistuneesti', 'success');
      navigate('/courses');
    } catch (error: any) {
      console.error('Virhe poistettaessa kurssia:', error);
      
      // Provide more specific error messages based on the error
      let errorMessage = 'Kurssin poistaminen epäonnistui';
      
      // Check if the error has a more specific message
      if (error.message && error.message.includes('Server error')) {
        // This is from our enhanced error handling in the service
        errorMessage = error.message;
        
        // Add more specific guidance based on common error scenarios
        if (error.message.includes('500')) {
          errorMessage += '. Tämä voi johtua siitä, että kurssilla on vielä sisältöä (tehtäviä, materiaaleja) tai opiskelijoita. Poista ensin kaikki kurssin sisältö ja poista opiskelijat kurssilta.';
        } else if (error.message.includes('403')) {
          errorMessage += '. Sinulla ei ole oikeuksia poistaa tätä kurssia.';
        } else if (error.message.includes('404')) {
          errorMessage += '. Kurssia ei löydy. Se on saatettu jo poistaa.';
        }
      }
      
      showSnackbar(errorMessage, 'error');
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowStudents = async (group: SchoolGroup) => {
    try {
      setSelectedGroup(group);
      
      if (group.students && Array.isArray(group.students) && group.students.length > 0) {
        console.log(`Ryhmällä ${group.id} on jo ${group.students.length} opiskelijaa:`, group.students);
        setGroupStudents(group.students);
        setStudentsDialogOpen(true);
        return;
      }
      
      console.log(`Haetaan ryhmän ${group.id} opiskelijat...`);
      const groupWithStudents = await groupService.getGroupWithStudents(group.id);
      
      if (groupWithStudents && groupWithStudents.students) {
        console.log(`Ryhmälle ${group.id} haettu ${groupWithStudents.students.length} opiskelijaa:`, groupWithStudents.students);
        setGroupStudents(groupWithStudents.students);
      } else {
        console.log(`Ryhmälle ${group.id} ei löytynyt opiskelijoita`);
        setGroupStudents([]);
      }
      
      setStudentsDialogOpen(true);
    } catch (error) {
      console.error('Virhe haettaessa ryhmän opiskelijoita:', error);
      showSnackbar('Virhe haettaessa ryhmän opiskelijoita', 'error');
    }
  };

  const handleEditGroup = async (e: React.MouseEvent, group: SchoolGroup) => {
    e.stopPropagation();
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || '');
    
    setLoadingAvailableStudents(true);
    try {
      const students = await groupService.getAvailableStudents(group.id);
      setAvailableStudents(students);
    } catch (error) {
      console.error('Virhe haettaessa saatavilla olevia opiskelijoita:', error);
      showSnackbar('Virhe haettaessa saatavilla olevia opiskelijoita', 'error');
    } finally {
      setLoadingAvailableStudents(false);
    }
    
    setSelectedStudentIds([]);
    
    setEditGroupDialogOpen(true);
  };

  const handleCloseEditGroupDialog = () => {
    setEditGroupDialogOpen(false);
    setEditingGroup(null);
    setEditGroupName('');
    setEditGroupDescription('');
    setAvailableStudents([]);
    setSelectedStudentIds([]);
  };

  const handleAddStudentsToGroup = async () => {
    if (!editingGroup || selectedStudentIds.length === 0) return;
    
    try {
      for (const studentId of selectedStudentIds) {
        await groupService.addStudentToGroup(editingGroup.id, studentId);
      }
      
      const updatedGroups = await groupService.getGroupsByCourse(id || '');
      dispatch(fetchSchoolGroupsSuccess(mapLegacyGroupsToRedux(updatedGroups)));
      
      const updatedAvailableStudents = await groupService.getAvailableStudents(editingGroup.id);
      setAvailableStudents(updatedAvailableStudents);
      
      setSelectedStudentIds([]);
      
      showSnackbar(`${selectedStudentIds.length} opiskelijaa lisätty ryhmään`, 'success');
    } catch (error) {
      console.error('Virhe lisättäessä opiskelijoita ryhmään:', error);
      showSnackbar('Virhe lisättäessä opiskelijoita ryhmään', 'error');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    try {
      setUpdatingGroup(true);
      
      // Update group with new data
      const updatedGroup = await groupService.updateGroup(editingGroup.id, {
        name: editGroupName,
        description: editGroupDescription || ''  // Ensure description is never undefined
      });
      
      if (updatedGroup) {
        dispatch(updateSchoolGroup(mapLegacyGroupToRedux(updatedGroup)));
      }
      
      // Refresh groups from the server
      await fetchCourseGroups();
      
      // Close dialog and reset state
      handleCloseEditGroupDialog();
      showSnackbar('Ryhmä päivitetty onnistuneesti', 'success');
    } catch (error) {
      console.error('Virhe päivitettäessä ryhmää:', error);
      showSnackbar('Virhe päivitettäessä ryhmää', 'error');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, group: SchoolGroup) => {
    e.stopPropagation();
    
    try {
      await groupService.deleteGroup(group.id);
      
      // Remove group from Redux store
      dispatch(deleteSchoolGroup(group.id));
      
      showSnackbar('Ryhmä poistettu onnistuneesti', 'success');
    } catch (error) {
      console.error('Virhe poistettaessa ryhmää:', error);
      showSnackbar('Virhe poistettaessa ryhmää', 'error');
    }
  };

  const handleCloseStudentsDialog = () => {
    setStudentsDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleAddExistingMaterials = async (materialIds: string[]) => {
    try {
      if (!id) return;

      setLoading(true);
      
      for (const materialId of materialIds) {
        await materialService.addMaterialToCourse(materialId, id || '');
      }
      
      await refreshCourseMaterials();
      
      handleCloseDialog();
      showSnackbar('Materials added successfully', 'success');
    } catch (error) {
      console.error('Error adding existing materials:', error);
      showSnackbar('Failed to add materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const assignmentData = {
        ...data,
        courseId: id
      };
      
      const newAssignment = await assignmentService.createAssignment(assignmentData);
      
      dispatch(addAssignment({
        ...newAssignment,
        description: newAssignment.description || '',
        dueDate: newAssignment.dueDate || '',
        courseId: newAssignment.courseId || '',
        createdAt: newAssignment.createdAt || '',
        status: '',
        relatedMaterials: []
      }));
      
      handleCloseDialog();
      
      showSnackbar('Tehtävä luotu onnistuneesti', 'success');
    } catch (error) {
      console.error('Virhe luotaessa tehtävää:', error);
      showSnackbar('Virhe luotaessa tehtävää', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExistingAssignments = async (assignmentIds: string[]) => {
    try {
      for (const assignmentId of assignmentIds) {
        const result = await assignmentService.addAssignmentToCourse(assignmentId, id || '');
        if (result) {
          dispatch(addAssignment({
            ...result,
            description: result.description || '',
            dueDate: result.dueDate || '',
            courseId: result.courseId || '',
            createdAt: result.createdAt || '',
            status: '',
            relatedMaterials: []
          }));
        }
      }
      
      handleCloseDialog();
      showSnackbar('Tehtävät lisätty kurssille onnistuneesti', 'success');
    } catch (error) {
      console.error('Virhe lisättäessä tehtäviä kurssille:', error);
      showSnackbar('Virhe lisättäessä tehtäviä kurssille', 'error');
    }
  };

  const handleCreateGroup = async (data: any) => {
    try {
      // Create the group
      const newGroup = await groupService.createGroup({
        ...data,
        courseId: id
      });
      
      // Convert ISchoolGroup to SchoolGroup using our mapper
      const mappedGroup = mapLegacyGroupToRedux(newGroup);
      
      // Add the group to the Redux store
      dispatch(addSchoolGroup(mappedGroup));
      
      // Now we need to associate the group with the course
      await groupService.addCourseToGroup(mappedGroup.id, id!);
      
      // Refresh the groups list to ensure we have the latest data
      await fetchCourseGroups();
      
      handleCloseDialog();
      
      showSnackbar('Ryhmä luotu onnistuneesti', 'success');
    } catch (error) {
      console.error('Virhe luotaessa ryhmää:', error);
      showSnackbar('Virhe luotaessa ryhmää', 'error');
    }
  };

  const handleAddExistingGroups = async (groupIds: string[]) => {
    try {
      let totalEnrolledStudents = 0;
      let errors: string[] = [];
      
      for (const groupId of groupIds) {
        const groupIdString = String(groupId);
        const result = await groupService.addCourseToGroup(groupIdString, id || '');
        
        if (result.success && result.enrolledStudents) {
          totalEnrolledStudents += result.enrolledStudents.length;
        } else if (!result.success && result.error) {
          // Find group name for better error message
          const group = availableGroups.find(g => g.id === groupIdString);
          const groupName = group ? group.name : groupIdString;
          errors.push(`Ryhmä "${groupName}": ${result.error}`);
        }
      }
      
      // Refresh the groups list to ensure the latest data
      const updatedGroups = await groupService.getGroupsByCourse(id!);
      
      // Convert ISchoolGroup[] to SchoolGroup[] using our mapper
      const mappedGroups = mapLegacyGroupsToRedux(updatedGroups);
      
      dispatch(fetchSchoolGroupsSuccess(mappedGroups));
      
      handleCloseDialog();
      
      if (errors.length > 0) {
        // Display error messages
        showSnackbar(`Virheitä lisättäessä ryhmiä: ${errors.join('; ')}`, 'error');
      } else {
        // Success message
        showSnackbar(`Ryhmät lisätty onnistuneesti. ${totalEnrolledStudents} opiskelijaa ilmoitettu kurssille.`, 'success');
      }
    } catch (error: any) {
      console.error('Error adding existing groups:', error);
      showSnackbar(error.message || 'Virhe lisättäessä ryhmiä', 'error');
    }
  };

  const handleMaterialDialogTabChange = (_: React.SyntheticEvent, newValue: "upload" | "existing") => {
    setMaterialDialogTab(newValue);
  };

  const handleAssignmentDialogTabChange = (_: React.SyntheticEvent, newValue: "existing" | "create") => {
    setAssignmentDialogTab(newValue);
  };

  const handleGroupDialogTabChange = (_: React.SyntheticEvent, newValue: "existing" | "create") => {
    setGroupDialogTab(newValue);
  };

  // Handle material upload success
  const handleMaterialUploadSuccess = (materialId: string) => {
    showSnackbar('Material uploaded successfully', 'success');
    refreshCourseMaterials();
  };
  
  // Handle material upload error
  const handleMaterialUploadError = (error: any) => {
    showSnackbar('Failed to upload material', 'error');
  };
  
  // Handle material deletion
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialService.deleteMaterial(materialId);
      showSnackbar('Material deleted successfully', 'success');
      refreshCourseMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      showSnackbar('Failed to delete material', 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      console.log('Deleting assignment:', assignmentId);
      await assignmentService.deleteAssignment(assignmentId);
      
      // Update the local state by fetching course assignments
      const refreshedAssignments = await assignmentService.getAssignmentsByCourse(id!);
      console.log('Refreshed assignments after deletion:', refreshedAssignments);
      dispatch(fetchAssignmentsSuccess(refreshedAssignments.map((a: any) => ({
        ...a,
        description: a.description || '',
        dueDate: a.dueDate || '',
        courseId: a.courseId || '',
        createdAt: a.createdAt || '',
        status: '',
        relatedMaterials: []
      }))));
      
      showSnackbar('Tehtävä poistettu onnistuneesti', 'success');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showSnackbar('Virhe tehtävän poistamisessa', 'error');
    }
  };

  // Tabs indices
  const MATERIALS_TAB = 0;
  const ASSIGNMENTS_TAB = 1;
  const GROUPS_TAB = 2;
  const STATISTICS_TAB = 3;
  const GRADES_TAB = 4;

  // Navigate to bulk upload page
  const handleBulkUpload = () => {
    console.log('Navigating to bulk upload page for course:', id);
    navigate(`/bulk-upload?courseId=${id}`);
  };

  return (
    <Container maxWidth="xl">
      {courseDetailError && <ErrorAlert message={courseDetailError} />}
      {courseDetailLoading ? (
        <LoadingSpinner />
      ) : currentCourse ? (
        <>
          <PageHeader 
            title={currentCourse.name || 'Course Detail'} 
            onBackClick={() => navigate('/courses')}
            action={
              isUserCanManage && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<CloudUploadIcon />}
                    onClick={() => navigate(`/bulk-upload/${id}`)}
                    variant="contained"
                    color="primary"
                  >
                    Bulk Upload
                  </Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/courses/${id}/edit`)}
                    variant="outlined"
                    color="primary"
                  >
                    Edit Course
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={refreshCourseMaterials}
                  >
                    Refresh Materials
                  </Button>
                </Box>
              )
            }
          />

          {/* Teachers panel */}
          {isTeacher ? (
            <CourseTeachersPanel 
              courseId={id || ''}
              mainTeacherId={courseData.teacherId || ''}
              canManage={isUserCanManage}
            />
          ) : (
            <CourseTeachersViewPanel 
              courseId={id || ''}
              mainTeacherId={courseData.teacherId || ''}
            />
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="course tabs"
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : undefined}
            >
              <Tab label="Materiaalit" id="course-tab-0" aria-controls="course-tabpanel-0" />
              <Tab label="Tehtävät" id="course-tab-1" aria-controls="course-tabpanel-1" />
              {isUserCanManage && (
                <Tab label="Ryhmät" id="course-tab-2" aria-controls="course-tabpanel-2" />
              )}
              {isUserCanManage && (
                <Tab 
                  label="Tilastot" 
                  id="course-tab-3" 
                  aria-controls="course-tabpanel-3"
                  icon={<PieChartIcon />}
                  iconPosition="start"
                />
              )}
              {isUserCanManage && (
                <Tab label="Arviot" id="course-tab-4" aria-controls="course-tabpanel-4" />
              )}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={MATERIALS_TAB}>
            <MaterialsTab 
              materials={courseMaterials}
              canManage={isUserCanManage}
              onAddMaterial={() => handleOpenDialog('material')}
              onDeleteMaterial={handleDeleteMaterial}
              onRefresh={refreshCourseMaterials}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={ASSIGNMENTS_TAB}>
            <AssignmentsTab 
              assignments={courseAssignments}
              canManage={isUserCanManage}
              onAddAssignment={() => handleOpenDialog('assignment')}
              onDeleteAssignment={handleDeleteAssignment}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={GROUPS_TAB}>
            <GroupsTab 
              groups={courseGroups}
              canManage={isUserCanManage}
              onAddGroup={() => handleOpenDialog('group')}
              onShowStudents={handleShowStudents}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={STATISTICS_TAB}>
            <StudentStatsDashboard courseId={id || ''} />
          </TabPanel>

          <TabPanel value={tabValue} index={GRADES_TAB}>
            <GradesTab 
              courseId={id || '0'} 
              isOwner={isUserCanManage}
            />
          </TabPanel>

          {/* Material Dialog */}
          {dialogType === 'material' && (
            <MaterialDialog
              open={dialogOpen && dialogType === 'material'}
              onClose={handleCloseDialog}
              courseId={id || ''}
              onCreateMaterial={handleMaterialUploadSuccess}
              onAddExistingMaterials={handleAddExistingMaterials}
            />
          )}

          {/* Assignment Dialog */}
          {dialogType === 'assignment' && (
            <AssignmentDialog
              open={dialogOpen && dialogType === 'assignment'}
              onClose={handleCloseDialog}
              courseId={id || ''}
              onCreateAssignment={handleCreateAssignment}
              onAddExistingAssignments={handleAddExistingAssignments}
            />
          )}

          {/* Group Dialog */}
          {dialogType === 'group' && (
            <GroupDialog
              open={dialogOpen && dialogType === 'group'}
              onClose={handleCloseDialog}
              courseId={id || ''}
              onCreateGroup={handleCreateGroup}
              onAddExistingGroups={handleAddExistingGroups}
            />
          )}

          {/* Students Dialog */}
          <StudentsDialog
            open={studentsDialogOpen}
            onClose={() => setStudentsDialogOpen(false)}
            group={selectedGroup}
            courseId={id || ''}
            canManage={isUserCanManage}
            onGroupsChange={() => {
              console.log("Refreshing course groups after change");
              fetchCourseGroups();
              showSnackbar('Kurssi poistettu ryhmästä onnistuneesti', 'success');
            }}
          />

          {/* Delete Course Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Poista kurssi</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Haluatko varmasti poistaa kurssin "{courseData.name}"? Tätä toimintoa ei voi peruuttaa.
              </DialogContentText>
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={cleanupBeforeDelete}
                      onChange={(e) => setCleanupBeforeDelete(e.target.checked)}
                      disabled={deleteLoading || cleanupInProgress}
                    />
                  }
                  label="Tyhjennä kurssin sisältö ennen poistamista (suositeltava)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 3 }}>
                  Tämä poistaa automaattisesti kurssin sisällön (tehtävät, materiaalit ja lohkot) ennen kurssin poistamista.
                  Suosittelemme tätä, jos kurssin poistamisessa on ongelmia.
                </Typography>
              </Box>
              
              {cleanupInProgress && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">Valmistellaan kurssia poistoa varten...</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading || cleanupInProgress}>Peruuta</Button>
              <Button 
                onClick={handleDeleteCourse} 
                color="error" 
                variant="contained"
                disabled={deleteLoading || cleanupInProgress}
                startIcon={deleteLoading ? <CircularProgress size={24} /> : null}
              >
                {deleteLoading ? 'Poistetaan...' : 'Poista kurssi'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert 
              onClose={() => setSnackbarOpen(false)} 
              severity={snackbarSeverity} 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      ) : (
        <Typography>Course not found</Typography>
      )}
    </Container>
  );
};

export default CourseDetail;
