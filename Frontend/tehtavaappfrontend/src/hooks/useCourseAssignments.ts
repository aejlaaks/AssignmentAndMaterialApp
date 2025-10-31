import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAssignmentsSuccess } from '../store/slices/courseSlice';
import { Assignment as ModelAssignment } from '../interfaces/models/Assignment';
import { Assignment as ReduxAssignment } from '../types';
import { useAssignmentService } from '../contexts/ServiceContext';

/**
 * Maps our model Assignment to the Redux Assignment type
 * This adapter function handles type compatibility between different interfaces
 */
const mapToReduxAssignment = (assignment: ModelAssignment): ReduxAssignment => {
  return {
    ...assignment,
    createdAt: typeof assignment.createdAt === 'object' 
      ? assignment.createdAt.toISOString() 
      : assignment.createdAt,
    updatedAt: typeof assignment.updatedAt === 'object' 
      ? assignment.updatedAt?.toISOString() 
      : assignment.updatedAt,
  };
};

/**
 * Hook for managing course assignments
 * 
 * This hook follows the Single Responsibility Principle by focusing only on
 * assignment-related operations for a specific course.
 * 
 * @param courseId The ID of the course
 */
export const useCourseAssignments = (courseId: string | undefined) => {
  // State
  const [assignments, setAssignments] = useState<ModelAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Services and utilities
  const assignmentService = useAssignmentService();
  const dispatch = useDispatch();

  /**
   * Fetch assignments for the course
   */
  const fetchAssignments = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      console.log(`Fetching assignments for course ${courseId} in useCourseAssignments hook`);
      const fetchedAssignments = await assignmentService.getAssignmentsByCourse(courseId);
      console.log('Raw assignments from API:', fetchedAssignments);
      
      // Update local state - ensure type compatibility with explicit casting
      setAssignments(fetchedAssignments as ModelAssignment[]);
      
      // Convert to Redux-compatible type and update store
      const reduxAssignments = fetchedAssignments.map((assignment) => mapToReduxAssignment(assignment as ModelAssignment));
      dispatch(fetchAssignmentsSuccess(reduxAssignments));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to load course assignments');
    } finally {
      setLoading(false);
    }
  }, [courseId, assignmentService, dispatch]);
  
  /**
   * Create a new assignment
   */
  const createAssignment = useCallback(async (assignmentData: any) => {
    try {
      // Make sure the assignment has the correct courseId
      const fullAssignmentData = {
        ...assignmentData,
        courseId
      };
      
      const newAssignment = await assignmentService.createAssignment(fullAssignmentData);
      
      // Update local state - use proper type casting
      setAssignments(prevAssignments => [...prevAssignments, newAssignment as ModelAssignment]);
      
      return { success: true, assignment: newAssignment };
    } catch (error) {
      console.error('Error creating assignment:', error);
      return { success: false, error };
    }
  }, [courseId, assignmentService]);
  
  /**
   * Delete an assignment
   */
  const deleteAssignment = useCallback(async (assignmentId: string) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      
      // Update local state by filtering out the deleted assignment
      setAssignments(prevAssignments => 
        prevAssignments.filter(assignment => assignment.id !== assignmentId)
      );
      
      return { success: true, message: 'Assignment deleted successfully' };
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return { success: false, message: 'Failed to delete assignment' };
    }
  }, [assignmentService]);

  // Load assignments when the component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId, fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    deleteAssignment
  };
}; 