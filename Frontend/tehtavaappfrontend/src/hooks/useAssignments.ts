import { useState, useCallback } from 'react';
import { assignmentService, IAssignment, ICreateAssignmentRequest, IUpdateAssignmentRequest } from '../services/assignments/assignmentService';
import { Assignment } from '../types/assignment';

// Helper function to convert Assignment to IAssignment
const mapAssignmentToIAssignment = (assignment: Assignment): IAssignment => {
  console.log(`Mapping assignment`, assignment);
  console.log(`Raw assignment status: ${assignment.status} (${typeof assignment.status})`);
  
  // Debug extra info for teacher assignments
  if (assignment.id) {
    console.log(`Debug: Assignment ${assignment.id} - ${assignment.title} - Status: ${assignment.status}`);
  }
  
  // Ensure the status is a non-empty string
  let statusValue = assignment.status;
  
  // If status is null, undefined, or not a string, set a default
  if (!statusValue) {
    console.log(`Setting default status for assignment ${assignment.id}`);
    statusValue = 'Published';
  }
  
  // Force status to be a string
  const statusString = String(statusValue);
  console.log(`Final status string: ${statusString}`);
  
  return {
    id: assignment.id || '',
    title: assignment.title || '',
    description: assignment.description || '',
    dueDate: assignment.dueDate || '',
    points: assignment.points || 0,
    courseId: assignment.courseId || '',
    createdById: assignment.createdBy || '',
    status: statusString // Use the processed string status
  };
};

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await assignmentService.getAssignments();
      
      // Map Assignment[] to IAssignment[] for consistency
      const mappedData = data.map(a => mapAssignmentToIAssignment(a));
      setAssignments(mappedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tehtävien hakeminen epäonnistui');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // New method to get assignments where user is a teacher
  const getTeacherAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching teacher assignments');
      const data = await assignmentService.getTeacherAssignments();
      console.log(`Found ${data.length} assignments for teacher`);
      
      // Map Assignment[] to IAssignment[]
      const mappedData = data.map(mapAssignmentToIAssignment);
      setAssignments(mappedData);
      return mappedData;
    } catch (err) {
      console.error('Error fetching teacher assignments:', err);
      setError(err instanceof Error ? err.message : 'Opettajan tehtävien hakeminen epäonnistui');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAssignmentById = useCallback(async (id: string | undefined) => {
    // If id is undefined or empty, return null immediately
    if (!id) {
      setError('Tehtävän ID puuttuu');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      return await assignmentService.getAssignmentById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tehtävän hakeminen epäonnistui');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAssignment = async (assignmentData: ICreateAssignmentRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const newAssignment = await assignmentService.createAssignment(assignmentData);
      // Update assignments list with new assignment
      const mappedAssignment = mapAssignmentToIAssignment(newAssignment);
      setAssignments(prev => [...prev, mappedAssignment]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tehtävän luominen epäonnistui');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssignment = async (assignmentData: IUpdateAssignmentRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedAssignment = await assignmentService.updateAssignment(assignmentData);
      // Update assignments list with updated assignment
      const mappedAssignment = mapAssignmentToIAssignment(updatedAssignment);
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === mappedAssignment.id ? mappedAssignment : assignment
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tehtävän päivittäminen epäonnistui');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await assignmentService.deleteAssignment(id);
      // Päivitä tehtävälista poistamalla poistettu tehtävä
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tehtävän poistaminen epäonnistui');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    assignments,
    isLoading, 
    error,
    getAssignments,
    getTeacherAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};
