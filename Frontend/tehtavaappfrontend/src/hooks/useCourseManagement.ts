import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useServices } from '../contexts/ServiceContext';
import { Course as CourseModel } from '../interfaces/models/Course';
import { Course as ReduxCourse } from '../types';
import { CreateCourseRequest, UpdateCourseRequest } from '../interfaces/services/ICourseService';
import { 
  setCurrentCourse as setCourse, 
  fetchCoursesSuccess as setCourses, 
  addCourse, 
  updateCourse as updateCourseAction, 
  deleteCourse as removeCourse 
} from '../store/slices/courseSlice';
import { setLoading, setError, setSuccess } from '../store/slices/uiSlice';
import { mapISchoolGroupToSchoolGroup } from '../utils/typeMappers';

/**
 * Helper function to convert the model Course to Redux Course for the store
 */
const mapToReduxCourse = (course: CourseModel): ReduxCourse => {
  return {
    ...course,
    // Ensure all dates are strings for Redux
    createdAt: course.createdAt instanceof Date ? course.createdAt.toISOString() : course.createdAt,
    updatedAt: course.updatedAt instanceof Date ? course.updatedAt.toISOString() : course.updatedAt,
    startDate: course.startDate instanceof Date ? course.startDate.toISOString() : course.startDate,
    endDate: course.endDate instanceof Date ? course.endDate.toISOString() : course.endDate,
    // Type assertion for groups to avoid type errors - this is safe at runtime
    groups: course.groups as any
  };
};

/**
 * Custom hook for managing courses
 * Encapsulates course-related business logic and state management
 */
export const useCourseManagement = () => {
  const dispatch = useDispatch();
  const { courseService, authService } = useServices();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  /**
   * Fetch all courses
   */
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'courses', loading: true }));

      const courses = await courseService.getCourses();
      
      console.log('Courses fetched:', courses);
      dispatch(setCourses(courses.map(mapToReduxCourse)));
      return courses;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching courses';
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'courses', error: errorMsg }));
      return [];
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'courses', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Fetch a specific course by ID
   */
  const fetchCourseById = useCallback(async (courseId: string) => {
    if (!courseId) return null;
    
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'course', loading: true }));

      const course = await courseService.getCourseById(courseId);
      
      if (course) {
        console.log('Course fetched:', course);
        dispatch(setCourse(mapToReduxCourse(course)));
      } else {
        console.log('No course found with ID:', courseId);
      }
      
      return course;
    } catch (err: any) {
      const errorMsg = err.message || `Error fetching course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'course', error: errorMsg }));
      return null;
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'course', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Fetch courses the current user is enrolled in
   */
  const fetchEnrolledCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'enrolledCourses', loading: true }));

      const courses = await courseService.getEnrolledCourses();
      
      console.log('Enrolled courses fetched:', courses);
      // Consider using a different slice for enrolled courses if needed
      dispatch(setCourses(courses.map(mapToReduxCourse)));
      return courses;
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching enrolled courses';
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'enrolledCourses', error: errorMsg }));
      return [];
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'enrolledCourses', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Create a new course
   */
  const createCourse = useCallback(async (courseData: CreateCourseRequest) => {
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'createCourse', loading: true }));

      // Ensure TeacherId is included
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        throw new Error('Käyttäjätunnus puuttuu. Kirjaudu sisään uudelleen.');
      }
      
      // Add TeacherId to the courseData
      const courseDataWithTeacher = {
        ...courseData,
        TeacherId: currentUser.id
      };

      console.log('Creating course with data:', courseDataWithTeacher);
      const newCourse = await courseService.createCourse(courseDataWithTeacher);
      
      console.log('Course created:', newCourse);
      dispatch(addCourse(mapToReduxCourse(newCourse)));
      dispatch(setSuccess({ entity: 'course', message: 'Kurssi luotu onnistuneesti' }));
      
      return newCourse;
    } catch (err: any) {
      const errorMsg = err.message || 'Virhe kurssia luotaessa';
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'createCourse', error: errorMsg }));
      return null;
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'createCourse', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Update an existing course
   */
  const updateCourse = useCallback(async (courseId: string, courseData: UpdateCourseRequest) => {
    if (!courseId) {
      setLocalError('Course ID is required');
      return null;
    }
    
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'updateCourse', loading: true }));

      const updatedCourse = await courseService.updateCourse(courseId, courseData);
      
      console.log('Course updated:', updatedCourse);
      dispatch(updateCourseAction(mapToReduxCourse(updatedCourse)));
      dispatch(setSuccess({ entity: 'course', message: 'Course updated successfully' }));
      
      return updatedCourse;
    } catch (err: any) {
      const errorMsg = err.message || `Error updating course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'updateCourse', error: errorMsg }));
      return null;
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'updateCourse', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Delete a course
   */
  const deleteCourse = useCallback(async (courseId: string) => {
    if (!courseId) {
      setLocalError('Course ID is required');
      return false;
    }
    
    try {
      setIsLoading(true);
      dispatch(setLoading({ entity: 'deleteCourse', loading: true }));

      // First clean up related data
      await courseService.cleanupCourseForDeletion(courseId);
      
      // Then delete the course
      await courseService.deleteCourse(courseId);
      
      console.log('Course deleted:', courseId);
      dispatch(removeCourse(courseId));
      dispatch(setSuccess({ entity: 'course', message: 'Course deleted successfully' }));
      
      return true;
    } catch (err: any) {
      const errorMsg = err.message || `Error deleting course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'deleteCourse', error: errorMsg }));
      return false;
    } finally {
      setIsLoading(false);
      dispatch(setLoading({ entity: 'deleteCourse', loading: false }));
    }
  }, [courseService, dispatch]);

  /**
   * Get teachers for a course
   */
  const getCourseTeachers = useCallback(async (courseId: string) => {
    if (!courseId) {
      setLocalError('Course ID is required');
      return [];
    }
    
    try {
      setIsLoading(true);
      
      const teachers = await courseService.getCourseTeachers(courseId);
      console.log('Course teachers fetched:', teachers);
      
      return teachers;
    } catch (err: any) {
      const errorMsg = err.message || `Error fetching teachers for course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [courseService]);

  /**
   * Get students for a course
   */
  const getCourseStudents = useCallback(async (courseId: string) => {
    if (!courseId) {
      setLocalError('Course ID is required');
      return [];
    }
    
    try {
      setIsLoading(true);
      
      const students = await courseService.getCourseStudents(courseId);
      console.log('Course students fetched:', students);
      
      return students;
    } catch (err: any) {
      const errorMsg = err.message || `Error fetching students for course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [courseService]);

  /**
   * Add a teacher to a course
   */
  const addTeacherToCourse = useCallback(async (courseId: string, teacherId: string) => {
    if (!courseId || !teacherId) {
      setLocalError('Course ID and Teacher ID are required');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const success = await courseService.addTeacherToCourse(courseId, { teacherId });
      
      if (success) {
        console.log(`Teacher ${teacherId} added to course ${courseId}`);
        dispatch(setSuccess({ entity: 'courseTeacher', message: 'Teacher added successfully' }));
      }
      
      return success;
    } catch (err: any) {
      const errorMsg = err.message || `Error adding teacher to course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'courseTeacher', error: errorMsg }));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [courseService, dispatch]);

  /**
   * Remove a teacher from a course
   */
  const removeTeacherFromCourse = useCallback(async (courseId: string, teacherId: string) => {
    if (!courseId || !teacherId) {
      setLocalError('Course ID and Teacher ID are required');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const success = await courseService.removeTeacherFromCourse(courseId, teacherId);
      
      if (success) {
        console.log(`Teacher ${teacherId} removed from course ${courseId}`);
        dispatch(setSuccess({ entity: 'courseTeacher', message: 'Teacher removed successfully' }));
      }
      
      return success;
    } catch (err: any) {
      const errorMsg = err.message || `Error removing teacher from course ${courseId}`;
      console.error(errorMsg, err);
      
      setLocalError(errorMsg);
      dispatch(setError({ entity: 'courseTeacher', error: errorMsg }));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [courseService, dispatch]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    // Data fetching functions
    fetchCourses,
    fetchCourseById,
    fetchEnrolledCourses,
    
    // Course management functions
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Teacher management functions
    getCourseTeachers,
    addTeacherToCourse,
    removeTeacherFromCourse,
    
    // Student management functions
    getCourseStudents,
    
    // State
    isLoading,
    error,
    resetError,
  };
}; 