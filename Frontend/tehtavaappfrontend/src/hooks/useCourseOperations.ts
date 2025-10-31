import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courses/courseService';
import { assignmentService } from '../services/assignments/assignmentService';
import { materialService } from '../services/materials/materialService';
import { groupService } from '../services/courses/groupService';

/**
 * Custom hook to manage course operations like deletion
 * 
 * @param courseId - The ID of the course to operate on
 * @returns Course operation state and handlers
 */
export const useCourseOperations = (courseId: string | undefined) => {
  const navigate = useNavigate();
  
  // Delete operation state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  
  // Snackbar notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  /**
   * Shows a snackbar notification
   */
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  /**
   * Deletes the current course
   */
  const handleDeleteCourse = useCallback(async (cleanupBeforeDelete: boolean) => {
    if (!courseId) return;
    
    try {
      setDeleteLoading(true);
      
      if (cleanupBeforeDelete) {
        setCleanupInProgress(true);
        
        try {
          // Try to remove assignments from the course
          const assignments = await assignmentService.getAssignmentsByCourse(courseId);
          for (const assignment of assignments) {
            await assignmentService.deleteAssignment(assignment.id);
          }
          console.log("All assignments removed from course");
          
          // Remove materials from the course
          // Skip material removal as it's not critical for course deletion
          
          // Clean up groups
          const groups = await groupService.getGroupsByCourse(courseId);
          for (const group of groups) {
            await groupService.deleteGroup(group.id);
          }
          console.log("All groups removed from course");
        } catch (cleanupError) {
          console.error("Error during cleanup: ", cleanupError);
          // Continue with deletion even if cleanup fails
        } finally {
          setCleanupInProgress(false);
        }
      }
      
      // Now delete the course
      await courseService.deleteCourse(courseId);
      
      // Navigate back to courses list
      navigate('/courses');
      
      showSnackbar('Kurssi poistettu onnistuneesti', 'success');
    } catch (error) {
      console.error('Error deleting course:', error);
      showSnackbar('Kurssin poistaminen epäonnistui', 'error');
      setDeleteLoading(false);
    }
  }, [courseId, navigate, showSnackbar]);

  return {
    // Delete operation state
    deleteLoading,
    cleanupInProgress,
    
    // Snackbar state
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    setSnackbarOpen,
    
    // Handlers
    handleDeleteCourse,
    showSnackbar
  };
}; 