import { courseService } from './courseService';
import { Course } from '../../types/CourseTypes';
import { cacheItem, getCachedItem, invalidateCacheByPrefix } from '../../utils/cacheUtils';

// Cache prefixes
const COURSE_CACHE_PREFIX = 'course-';
const ENROLLED_COURSES_CACHE_KEY = 'enrolled-courses';
const ALL_COURSES_CACHE_KEY = 'all-courses';
const COURSE_TEACHERS_PREFIX = 'course-teachers-';
const COURSE_STUDENTS_PREFIX = 'course-students-';

// Cache TTLs
const COURSES_TTL = 3 * 60 * 60 * 1000; // 3 hours for courses

// Extended courseService with caching capabilities
export const courseServiceWithCache = {
  ...courseService,
  
  // Get all courses with caching
  async getCourses(forceRefresh = false): Promise<Course[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedCourses = await getCachedItem<Course[]>(`${COURSE_CACHE_PREFIX}${ALL_COURSES_CACHE_KEY}`);
        if (cachedCourses) {
          console.log('[CourseService] Using cached courses');
          return cachedCourses;
        }
      }

      // Fetch fresh data
      const courses = await courseService.getCourses();
      
      // Cache the result
      await cacheItem(`${COURSE_CACHE_PREFIX}${ALL_COURSES_CACHE_KEY}`, courses, COURSES_TTL);
      
      return courses;
    } catch (error) {
      console.error('[CourseService] Error in getCourses with cache:', error);
      throw error;
    }
  },

  // Get enrolled courses with caching
  async getEnrolledCourses(forceRefresh = false): Promise<Course[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedCourses = await getCachedItem<Course[]>(`${COURSE_CACHE_PREFIX}${ENROLLED_COURSES_CACHE_KEY}`);
        if (cachedCourses) {
          console.log('[CourseService] Using cached enrolled courses');
          return cachedCourses;
        }
      }

      // Fetch fresh data
      const courses = await courseService.getEnrolledCourses();
      
      // Cache the result
      await cacheItem(`${COURSE_CACHE_PREFIX}${ENROLLED_COURSES_CACHE_KEY}`, courses, COURSES_TTL);
      
      return courses;
    } catch (error) {
      console.error('[CourseService] Error in getEnrolledCourses with cache:', error);
      throw error;
    }
  },

  // Get course by ID with caching
  async getCourseById(id: string, forceRefresh = false): Promise<any> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedCourse = await getCachedItem<any>(`${COURSE_CACHE_PREFIX}${id}`);
        if (cachedCourse) {
          console.log(`[CourseService] Using cached course for ID ${id}`);
          return cachedCourse;
        }
      }

      // Fetch fresh data
      const course = await courseService.getCourseById(id);
      
      if (course) {
        // Cache the result
        await cacheItem(`${COURSE_CACHE_PREFIX}${id}`, course, COURSES_TTL);
      }
      
      return course;
    } catch (error) {
      console.error(`[CourseService] Error in getCourseById with cache for ID ${id}:`, error);
      throw error;
    }
  },

  // Get course students with caching
  async getCourseStudents(courseId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedStudents = await getCachedItem<any[]>(`${COURSE_STUDENTS_PREFIX}${courseId}`);
        if (cachedStudents) {
          console.log(`[CourseService] Using cached students for course ${courseId}`);
          return cachedStudents;
        }
      }

      // Fetch fresh data
      const students = await courseService.getCourseStudents(courseId);
      
      // Cache the result
      await cacheItem(`${COURSE_STUDENTS_PREFIX}${courseId}`, students, COURSES_TTL);
      
      return students;
    } catch (error) {
      console.error(`[CourseService] Error in getCourseStudents with cache for course ${courseId}:`, error);
      throw error;
    }
  },

  // Get course teachers with caching
  async getCourseTeachers(courseId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedTeachers = await getCachedItem<any[]>(`${COURSE_TEACHERS_PREFIX}${courseId}`);
        if (cachedTeachers) {
          console.log(`[CourseService] Using cached teachers for course ${courseId}`);
          return cachedTeachers;
        }
      }

      // Fetch fresh data
      const teachers = await courseService.getCourseTeachers(courseId);
      
      // Cache the result
      await cacheItem(`${COURSE_TEACHERS_PREFIX}${courseId}`, teachers, COURSES_TTL);
      
      return teachers;
    } catch (error) {
      console.error(`[CourseService] Error in getCourseTeachers with cache for course ${courseId}:`, error);
      throw error;
    }
  },

  // Create course with cache invalidation
  async createCourse(courseData: any): Promise<any> {
    try {
      const course = await courseService.createCourse(courseData);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ALL_COURSES_CACHE_KEY}`);
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ENROLLED_COURSES_CACHE_KEY}`);
      
      return course;
    } catch (error) {
      console.error('[CourseService] Error in createCourse with cache:', error);
      throw error;
    }
  },

  // Update course with cache invalidation
  async updateCourse(id: string, courseData: any): Promise<any> {
    try {
      const course = await courseService.updateCourse(id, courseData);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${id}`);
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ALL_COURSES_CACHE_KEY}`);
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ENROLLED_COURSES_CACHE_KEY}`);
      
      return course;
    } catch (error) {
      console.error(`[CourseService] Error in updateCourse with cache for ID ${id}:`, error);
      throw error;
    }
  },

  // Delete course with cache invalidation
  async deleteCourse(id: string): Promise<void> {
    try {
      await courseService.deleteCourse(id);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${id}`);
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ALL_COURSES_CACHE_KEY}`);
      await invalidateCacheByPrefix(`${COURSE_CACHE_PREFIX}${ENROLLED_COURSES_CACHE_KEY}`);
      
    } catch (error) {
      console.error(`[CourseService] Error in deleteCourse with cache for ID ${id}:`, error);
      throw error;
    }
  }
}; 