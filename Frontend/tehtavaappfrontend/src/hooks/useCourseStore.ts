import { useState, useCallback } from 'react';
import { courseService } from '../services/courses/courseService';
import { Course, courseMappers } from '../types/CourseTypes';

/**
 * Hook for managing course data and state
 * 
 * Provides methods for fetching and managing course data, abstracting away API calls
 */
export const useCourseStore = () => {
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a single course by ID
   */
  const fetchCourseById = useCallback(async (courseId: string) => {
    console.log('Fetching course by ID:', courseId);
    setLoading(true);
    setError(null);
    
    try {
      const result = await courseService.getCourseById(courseId);
      console.log('Raw course data from API:', result);
      const mappedCourse = courseMappers.toUiModel(result);
      console.log('Mapped course data:', mappedCourse);
      setCourse(mappedCourse);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to fetch course');
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all courses
   */
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await courseService.getCourses();
      const mappedCourses = Array.isArray(results) 
        ? results.map(course => courseMappers.toUiModel(course))
        : [];
        
      setCourses(mappedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a course in the local state
   */
  const updateCourse = useCallback((updatedCourse: Course) => {
    setCourse(updatedCourse);
    setCourses(prevCourses => 
      prevCourses.map(c => c.id === updatedCourse.id ? updatedCourse : c)
    );
  }, []);

  return {
    course,
    courses,
    loading,
    error,
    fetchCourseById,
    fetchCourses,
    updateCourse,
    setCourse
  };
}; 