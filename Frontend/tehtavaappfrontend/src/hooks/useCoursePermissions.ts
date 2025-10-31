import { useMemo } from 'react';
import { useAuthStatus } from './useRedux';
import { UserRole } from '../types';

/**
 * Custom hook for managing course permissions.
 * Follows the Single Responsibility Principle by focusing on permission logic.
 * Encapsulates role-based access control logic.
 */
export const useCoursePermissions = (courseTeacherId?: string, courseId?: string) => {
  const { user } = useAuthStatus();

  /**
   * Check if user is a teacher or admin
   */
  const isTeacherOrAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.Teacher || user.role === UserRole.Admin;
  }, [user]);

  /**
   * Check if user is the course teacher
   */
  const isCourseTeacher = useMemo(() => {
    if (!user || !courseTeacherId) return false;
    return user.id === courseTeacherId;
  }, [user, courseTeacherId]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.Admin;
  }, [user]);

  /**
   * Check if user is a student
   */
  const isStudent = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.Student;
  }, [user]);

  /**
   * Check if user can manage the course (teacher, course teacher, or admin)
   */
  const canManageCourse = useMemo(() => {
    if (!user) return false;
    
    // Admins can manage all courses
    if (user.role === UserRole.Admin) return true;
    
    // Course teacher can manage their course
    if (courseTeacherId && user.id === courseTeacherId) return true;
    
    // Teachers can manage courses (if they're the course teacher or admin added them)
    if (user.role === UserRole.Teacher && courseTeacherId && user.id === courseTeacherId) {
      return true;
    }
    
    return false;
  }, [user, courseTeacherId]);

  /**
   * Check if user can create materials
   */
  const canCreateMaterials = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can edit materials
   */
  const canEditMaterials = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can delete materials
   */
  const canDeleteMaterials = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can create assignments
   */
  const canCreateAssignments = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can edit assignments
   */
  const canEditAssignments = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can delete assignments
   */
  const canDeleteAssignments = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can manage groups
   */
  const canManageGroups = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can view statistics
   */
  const canViewStatistics = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can grade submissions
   */
  const canGradeSubmissions = useMemo(() => {
    return canManageCourse;
  }, [canManageCourse]);

  /**
   * Check if user can enroll in the course
   */
  const canEnroll = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.Student;
  }, [user]);

  return {
    user,
    isTeacherOrAdmin,
    isCourseTeacher,
    isAdmin,
    isStudent,
    canManageCourse,
    canCreateMaterials,
    canEditMaterials,
    canDeleteMaterials,
    canCreateAssignments,
    canEditAssignments,
    canDeleteAssignments,
    canManageGroups,
    canViewStatistics,
    canGradeSubmissions,
    canEnroll
  };
};

