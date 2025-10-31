import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useServices } from '../contexts/ServiceContext';
import { Course } from '../interfaces/models/Course';
import { CreateCourseRequest, UpdateCourseRequest } from '../interfaces/services/ICourseService';
import { 
  fetchCoursesStart, 
  fetchCoursesSuccess, 
  fetchCoursesFailure,
  addCourse,
  updateCourse as updateCourseAction,
  deleteCourse as deleteCourseAction
} from '../store/slices/courseSlice';
import { RootState } from '../store';
import { mapLegacyCourseToRedux, mapLegacyCoursesToRedux } from '../utils/typeMappers';

/**
 * Custom hook for course operations, using Redux for state management
 * 
 * @deprecated This hook now uses Redux directly. Consider migrating to
 * useSelector/useDispatch pattern for better performance.
 */
export const useCourses = () => {
  const dispatch = useDispatch();
  const { courseService } = useServices();
  
  // Get courses and state from Redux store
  const courses = useSelector((state: RootState) => state.courses.courses);
  const loading = useSelector((state: RootState) => state.courses.isLoading);
  const error = useSelector((state: RootState) => state.courses.error);

  // Fetch all courses
  const getCourses = useCallback(async () => {
    dispatch(fetchCoursesStart());
    
    try {
      console.log('Fetching courses...');
      const coursesData = await courseService.getCourses();
      console.log('Courses fetched:', coursesData);
      
      // Map to Redux-compatible format
      const mappedCourses = mapLegacyCoursesToRedux(coursesData);
      
      dispatch(fetchCoursesSuccess(mappedCourses));
      return mappedCourses;
    } catch (err) {
      console.error('Error fetching courses:', err);
      dispatch(fetchCoursesFailure('Failed to fetch courses'));
      return [];
    }
  }, [dispatch, courseService]);

  // Create a new course
  const createCourse = useCallback(async (courseData: CreateCourseRequest) => {
    try {
      dispatch(fetchCoursesStart());
      const createdCourse = await courseService.createCourse(courseData);
      
      if (createdCourse) {
        const mappedCourse = mapLegacyCourseToRedux(createdCourse);
        dispatch(addCourse(mappedCourse));
      }
      
      return createdCourse;
    } catch (err) {
      console.error('Error creating course:', err);
      dispatch(fetchCoursesFailure('Failed to create course'));
      throw err;
    }
  }, [dispatch, courseService]);

  // Update an existing course
  const updateCourse = useCallback(async (id: string, courseData: UpdateCourseRequest) => {
    try {
      dispatch(fetchCoursesStart());
      const updatedCourse = await courseService.updateCourse(id, courseData);
      
      if (updatedCourse) {
        const mappedCourse = mapLegacyCourseToRedux(updatedCourse);
        dispatch(updateCourseAction(mappedCourse));
      }
      
      return updatedCourse;
    } catch (err) {
      console.error('Error updating course:', err);
      dispatch(fetchCoursesFailure('Failed to update course'));
      throw err;
    }
  }, [dispatch, courseService]);

  // Delete a course
  const deleteCourse = useCallback(async (id: string) => {
    try {
      dispatch(fetchCoursesStart());
      await courseService.deleteCourse(id);
      dispatch(deleteCourseAction(id));
      return true;
    } catch (err) {
      console.error('Error deleting course:', err);
      dispatch(fetchCoursesFailure('Failed to delete course'));
      throw err;
    }
  }, [dispatch, courseService]);

  return {
    courses,
    loading,
    error,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse
  };
};
