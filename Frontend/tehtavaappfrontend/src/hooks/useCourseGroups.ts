import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchSchoolGroupsSuccess } from '../store/slices/courseSlice';
import { SchoolGroup } from '../interfaces/models/SchoolGroup';
import { Student } from '../interfaces/models/Student';
import { useGroupService } from '../contexts/ServiceContext';
import { CreateGroupRequest, UpdateGroupRequest } from '../interfaces/services/IGroupService';
import { mapISchoolGroupsToSchoolGroups, mapISchoolGroupToSchoolGroup } from '../utils/typeMappers';
import { ISchoolGroup } from '../services/courses/groupService';

/**
 * Maps our model SchoolGroup to the Redux SchoolGroup type
 * This adapter function handles type compatibility between different interfaces
 */
const mapToReduxSchoolGroup = (group: SchoolGroup): any => {
  return {
    ...group,
    createdAt: typeof group.createdAt === 'object'
      ? group.createdAt.toISOString()
      : group.createdAt,
    updatedAt: typeof group.updatedAt === 'object'
      ? group.updatedAt.toISOString()
      : group.updatedAt,
  };
};

/**
 * Hook for managing course groups
 * 
 * This hook follows the Single Responsibility Principle by focusing only on
 * group-related operations for a specific course.
 * 
 * @param courseId The ID of the course
 */
export const useCourseGroups = (courseId: string | undefined) => {
  // State
  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  
  // Services and utilities
  const groupService = useGroupService();
  const dispatch = useDispatch();

  /**
   * Fetch groups for the course
   */
  const fetchGroups = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      console.log(`Fetching groups for course ${courseId} in useCourseGroups hook`);
      const fetchedGroups = await groupService.getGroupsByCourse(courseId);
      console.log('Raw groups from API:', fetchedGroups);
      
      // Update local state
      setGroups(mapISchoolGroupsToSchoolGroups(fetchedGroups));
      
      // Convert to Redux-compatible type and update store
      dispatch(fetchSchoolGroupsSuccess(mapISchoolGroupsToSchoolGroups(fetchedGroups)));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load course groups');
    } finally {
      setLoading(false);
    }
  }, [courseId, groupService, dispatch]);
  
  /**
   * Create a new group
   */
  const createGroup = useCallback(async (groupData: Omit<CreateGroupRequest, 'courseIds'>) => {
    try {
      // Make sure the group has the correct courseId
      const fullGroupData: CreateGroupRequest = {
        ...groupData,
        courseIds: courseId ? [courseId] : []
      };
      
      const newGroup = await groupService.createGroup(fullGroupData);
      
      // Update local state
      setGroups(prevGroups => [...prevGroups, mapISchoolGroupToSchoolGroup(newGroup)]);
      
      return { success: true, group: newGroup };
    } catch (error) {
      console.error('Error creating group:', error);
      return { success: false, error };
    }
  }, [courseId, groupService]);
  
  /**
   * Update an existing group
   */
  const updateGroup = useCallback(async (groupId: string, groupData: UpdateGroupRequest) => {
    try {
      const updatedGroup = await groupService.updateGroup(groupId, groupData);
      
      if (updatedGroup) {
        // Update local state
        setGroups(prevGroups => 
          prevGroups.filter(g => g.id !== groupId).concat(mapISchoolGroupToSchoolGroup(updatedGroup))
        );
        
        return { success: true, group: updatedGroup };
      }
      
      return { success: false, error: 'Failed to update group' };
    } catch (error) {
      console.error('Error updating group:', error);
      return { success: false, error };
    }
  }, [groupService]);
  
  /**
   * Delete a group
   */
  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      const success = await groupService.deleteGroup(groupId);
      
      if (success) {
        // Update local state by filtering out the deleted group
        setGroups(prevGroups => 
          prevGroups.filter(g => g.id !== groupId)
        );
        
        return { success: true, message: 'Group deleted successfully' };
      }
      
      return { success: false, message: 'Failed to delete group' };
    } catch (error) {
      console.error('Error deleting group:', error);
      return { success: false, message: 'Failed to delete group' };
    }
  }, [groupService]);
  
  /**
   * Get a group with its students
   */
  const getGroupWithStudents = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      const group = await groupService.getGroupWithStudents(groupId);
      
      if (group) {
        setSelectedGroup(mapISchoolGroupToSchoolGroup(group));
        return { success: true, group };
      }
      
      return { success: false, error: 'Failed to fetch group details' };
    } catch (error) {
      console.error('Error fetching group with students:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [groupService]);
  
  /**
   * Get all available students that can be added to a group
   */
  const fetchAvailableStudents = useCallback(async (groupId: string) => {
    try {
      setLoadingAvailableStudents(true);
      const students = await groupService.getAvailableStudents(groupId);
      setAvailableStudents(students.map(student => ({
        id: student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        userName: student.email || '',
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`,
        role: student.role || 'Student'
      })));
      return { success: true, students };
    } catch (error) {
      console.error('Error fetching available students:', error);
      return { success: false, error };
    } finally {
      setLoadingAvailableStudents(false);
    }
  }, [groupService]);
  
  /**
   * Add a student to a group
   */
  const addStudentToGroup = useCallback(async (groupId: string, studentId: string) => {
    try {
      const result = await groupService.addStudentToGroup(groupId, studentId);
      
      if (result === true) {
        // Refresh the group data to get updated students
        await getGroupWithStudents(groupId);
        return { success: true, message: 'Student added successfully' };
      }
      
      return { success: false, message: 'Failed to add student' };
    } catch (error) {
      console.error('Error adding student to group:', error);
      return { success: false, message: 'Failed to add student to group' };
    }
  }, [groupService, getGroupWithStudents]);
  
  /**
   * Remove a student from a group
   */
  const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
    try {
      const result = await groupService.removeStudentFromGroup(groupId, studentId);
      
      if (result) {
        // Refresh the group details to show the updated list
        await getGroupWithStudents(groupId);
        return { success: true, message: 'Student removed from group' };
      }
      
      return { success: false, message: 'Failed to remove student from group' };
    } catch (error) {
      console.error('Error removing student from group:', error);
      return { success: false, message: 'Failed to remove student from group', error };
    }
  }, [groupService, getGroupWithStudents]);

  /**
   * Remove a course from a group
   */
  const removeCourseFromGroup = useCallback(async (groupId: string, courseId: string) => {
    try {
      const result = await groupService.removeCourseFromGroup(groupId, courseId);
      
      if (result.success) {
        // Refresh the groups to update the UI
        await fetchGroups();
        return { success: true, message: 'Course removed from group' };
      }
      
      return { success: false, message: result.error || 'Failed to remove course from group' };
    } catch (error) {
      console.error('Error removing course from group:', error);
      return { success: false, message: 'Failed to remove course from group', error };
    }
  }, [groupService, fetchGroups]);

  // Load groups when the component mounts or courseId changes
  useEffect(() => {
    if (courseId) {
      fetchGroups();
    }
  }, [courseId, fetchGroups]);

  return {
    groups,
    loading,
    error,
    selectedGroup,
    availableStudents,
    loadingAvailableStudents,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupWithStudents,
    fetchAvailableStudents,
    addStudentToGroup,
    removeStudentFromGroup,
    removeCourseFromGroup
  };
}; 