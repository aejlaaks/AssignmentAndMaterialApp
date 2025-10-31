import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { IMaterial } from '../services/materials/materialTypes';
import { materialService } from '../services/materials/materialService';
import { courseService } from '../services/courses/courseService';
import { assignmentService } from '../services/assignments/assignmentService';
import { setCurrentCourse, fetchAssignmentsSuccess, fetchSchoolGroupsSuccess } from '../store/slices/courseSlice';
import { Assignment } from '../types/assignment';
import { UserRole } from '../types';
import { authService } from '../services/auth/authService';
import { groupService } from '../services/courses/groupService';
import { mapISchoolGroupsToSchoolGroups } from '../utils/typeMappers';

export const useCourseDetail = (courseId: string | undefined) => {
  const dispatch = useDispatch();
  const [courseMaterials, setCourseMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { currentCourse, assignments, schoolGroups } = useSelector((state: RootState) => state.courses);
  const user = authService.getCurrentUser();
  
  console.log('User data:', user);
  console.log('User role:', user?.role);
  
  const isAdmin = user?.role === UserRole.Admin;
  const isTeacher = user?.role === UserRole.Teacher;
  
  // Check if the current user is the main teacher for this course
  const isMainTeacher = isTeacher && 
    currentCourse && 
    currentCourse.teacherId && 
    user?.id && 
    currentCourse.teacherId === user.id;
    
  // A user can manage the course if they're an admin or the main teacher
  const canManage = isAdmin || isMainTeacher;
  
  console.log('isAdmin:', isAdmin);
  console.log('isTeacher:', isTeacher);
  console.log('isMainTeacher:', isMainTeacher);
  console.log('canManage:', canManage);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    
    setLoading(true);
    let hasError = false;
    let errorMessage = '';

    // Hae kurssin tiedot
    try {
      const course = await courseService.getCourseById(courseId);
      dispatch(setCurrentCourse(course));
      console.log('Course details fetched successfully:', course);
    } catch (err: any) {
      console.error('Error fetching course details:', err);
      hasError = true;
      errorMessage = 'Failed to load course details';
      // Jatka silti muiden tietojen hakemista
    }
    
    // Hae kurssin tehtävät
    try {
      console.log('Fetching assignments for course:', courseId);
      const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
      
      // Muunna tehtävät oikeaan muotoon Redux-storea varten
      const formattedAssignments: any[] = courseAssignments.map((assignment: Assignment) => ({
        ...assignment,
        dueDate: assignment.dueDate // Käytä dueDate-kenttää
      }));
      
      dispatch(fetchAssignmentsSuccess(formattedAssignments));
      console.log('Assignments fetched successfully:', formattedAssignments);
    } catch (err: any) {
      console.error('Error fetching course assignments:', err);
      // Älä aseta virhettä, jos vain tehtävien haku epäonnistui
    }
    
    // Hae kurssin ryhmät
    try {
      console.log('Fetching groups for course:', courseId);
      const courseGroups = await groupService.getGroupsByCourse(courseId);
      dispatch(fetchSchoolGroupsSuccess(mapISchoolGroupsToSchoolGroups(courseGroups)));
      console.log('Groups fetched successfully:', courseGroups);
    } catch (err: any) {
      console.error('Error fetching course groups:', err);
      // Älä aseta virhettä, jos vain ryhmien haku epäonnistui
    }
    
    if (hasError) {
      setError(errorMessage);
    } else {
      setError(null);
    }
    
    setLoading(false);
  };

  const fetchMaterials = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      console.log(`Fetching materials for course ${courseId} in useCourseDetail hook`);
      const materials = await materialService.getMaterials(courseId);
      console.log('Raw materials from API:', materials);
      
      // Don't filter by courseId again - the backend already filtered for us
      // Just ensure all required fields are present
      const processedMaterials = materials.map((m: any) => ({
        ...m,
        id: m.id,
        title: m.title,
        description: m.description || '',
        content: m.content || '',
        // Keep original courseId, don't override it
      }));
        
      console.log('Processed materials after mapping:', processedMaterials);
      console.log('Materials count after processing:', processedMaterials.length);
      
      setCourseMaterials(processedMaterials);
      setError(null);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load course materials');
    } finally {
      setLoading(false);
    }
  };
  
  // Add a dedicated function to refresh groups
  const fetchGroups = async () => {
    if (!courseId) return;
    
    try {
      console.log('Refreshing groups for course:', courseId);
      const courseGroups = await groupService.getGroupsByCourse(courseId);
      dispatch(fetchSchoolGroupsSuccess(mapISchoolGroupsToSchoolGroups(courseGroups)));
      console.log('Groups refreshed successfully:', courseGroups);
      return courseGroups;
    } catch (err) {
      console.error('Error refreshing course groups:', err);
      return [];
    }
  };

  useEffect(() => {
    if (courseId) {
      // Käytetään useEffectin sisällä muuttujaa estämään useEffectin suorittaminen useamman kerran
      let isMounted = true;
      
      const fetchData = async () => {
        if (isMounted) {
          await fetchCourseDetails();
          await fetchMaterials();
        }
      };
      
      fetchData();
      
      // Cleanup-funktio, joka suoritetaan, kun komponentti unmountataan
      return () => {
        isMounted = false;
      };
    }
  }, [courseId, dispatch]); // Lisätty dispatch riippuvuuslistaan

  const handleMaterialUploadSuccess = (materialId: string) => {
    showSnackbar('Material uploaded successfully', 'success');
    fetchMaterials();
  };

  const handleMaterialUploadError = (error: any) => {
    showSnackbar('Failed to upload material', 'error');
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialService.deleteMaterial(materialId);
      setCourseMaterials(prevMaterials => 
        prevMaterials.filter(material => material.id !== materialId)
      );
      showSnackbar('Material deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting material:', error);
      showSnackbar('Failed to delete material', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return {
    courseMaterials,
    loading,
    error,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    currentCourse,
    assignments,
    schoolGroups,
    isAdmin,
    isTeacher,
    canManage,
    fetchMaterials,
    fetchGroups,
    handleMaterialUploadSuccess,
    handleMaterialUploadError,
    handleDeleteMaterial,
    showSnackbar,
    handleCloseSnackbar
  };
};
