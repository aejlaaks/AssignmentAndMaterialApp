import axios from 'axios';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { ICourseService, CreateCourseRequest, UpdateCourseRequest, AddTeacherRequest } from '../../interfaces/services/ICourseService';
import { Course, CourseTeacher } from '../../interfaces/models/Course';
import { User } from '../../types';
import { Teacher } from '../../interfaces/models/Teacher';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Concrete implementation of the ICourseService interface
 * Following Single Responsibility Principle by handling only course-related operations
 */
export class CourseServiceImpl implements ICourseService {
  private baseUrl = `${API_URL}/courses`;

  async getCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/course');
      const data = response.data;
      
      console.log('Raw courses data:', data);
      
      return this.normalizeCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getAvailableCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/course/available');
      const data = response.data;
      
      console.log('Raw available courses data:', data);
      
      // If specific endpoint doesn't exist, fall back to all courses
      if (response.status === 404) {
        console.log('Available courses endpoint not found, falling back to all courses');
        return this.getCourses();
      }
      
      return this.normalizeCourses(data);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      
      // Fall back to all courses
      try {
        console.log('Falling back to all courses');
        return this.getCourses();
      } catch (innerError) {
        console.error('Error in fallback:', innerError);
        throw error;
      }
    }
  }

  async getCourseById(id: string): Promise<Course | null> {
    try {
      if (!id) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Fetching course ${id}`);
      const response = await api.get(`/course/${id}`);
      
      // Convert any date string properties to Date objects if needed
      const course = response.data;
      
      console.log(`Course ${id} fetched successfully:`, course);
      return course;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      return null;
    }
  }

  async createCourse(request: CreateCourseRequest): Promise<Course> {
    try {
      console.log('Creating course:', request);
      const response = await api.post('/course', request);
      
      console.log('Course created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(id: string, request: UpdateCourseRequest): Promise<Course> {
    try {
      console.log(`Updating course ${id} with data:`, request);
      
      // Get the existing course first to preserve required fields
      const existingCourse = await this.getCourseById(id);
      
      if (!existingCourse) {
        throw new Error(`Course with ID ${id} not found`);
      }
      
      // Create updated course data, preserving the Code field
      const updateData = {
        ...request,
        code: existingCourse.code // Preserve the code field
      };
      
      console.log(`Sending update with preserved Code field:`, updateData);
      const response = await api.put(`/course/${id}`, updateData);
      
      console.log(`Course ${id} updated successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      throw error;
    }
  }

  async getCourseStudents(courseId: string): Promise<User[]> {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Fetching students for course ${courseId}`);
      const response = await api.get(`/course/${courseId}/students`);
      
      console.log(`Students for course ${courseId} fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      return [];
    }
  }

  async cleanupCourseForDeletion(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Cleaning up course ${id} for deletion`);
      
      // First try the specific cleanup endpoint if it exists
      try {
        await api.post(`/course/${id}/cleanup`);
        console.log(`Course ${id} cleaned up successfully`);
        return;
      } catch (cleanupError: any) {
        // If endpoint doesn't exist, proceed with manual cleanup
        if (cleanupError.response && cleanupError.response.status === 404) {
          console.log('Cleanup endpoint not found, performing manual cleanup');
          
          // Manual cleanup steps
          try {
            // 1. Delete assignments
            await api.delete(`/assignment/course/${id}`);
            console.log(`Assignments for course ${id} deleted`);
          } catch (assignmentError) {
            console.error(`Error deleting assignments for course ${id}:`, assignmentError);
          }
          
          try {
            // 2. Delete materials
            await api.delete(`/material/course/${id}`);
            console.log(`Materials for course ${id} deleted`);
          } catch (materialError) {
            console.error(`Error deleting materials for course ${id}:`, materialError);
          }
          
          try {
            // 3. Delete groups
            await api.delete(`/group/course/${id}`);
            console.log(`Groups for course ${id} deleted`);
          } catch (groupError) {
            console.error(`Error deleting groups for course ${id}:`, groupError);
          }
          
          console.log(`Manual cleanup for course ${id} completed`);
          return;
        }
        
        // For other errors, re-throw
        throw cleanupError;
      }
    } catch (error) {
      console.error(`Error cleaning up course ${id}:`, error);
      throw error;
    }
  }

  async deleteCourse(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Deleting course ${id}`);
      await api.delete(`/course/${id}`);
      
      console.log(`Course ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      throw error;
    }
  }

  async getEnrolledCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/course/enrolled');
      console.log('Raw enrolled courses data:', response.data);
      
      return this.normalizeCourses(response.data);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  }

  async getCourseTeachers(courseId: string): Promise<Teacher[]> {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Fetching teachers for course ${courseId}`);
      const response = await api.get(`/course/${courseId}/teachers`);
      
      const teachers = response.data;
      console.log(`Teachers for course ${courseId} fetched successfully:`, teachers);
      
      return teachers;
    } catch (error) {
      console.error(`Error fetching teachers for course ${courseId}:`, error);
      throw error;
    }
  }

  async addTeacherToCourse(courseId: string, request: AddTeacherRequest): Promise<Teacher> {
    try {
      if (!courseId || !request.teacherId) {
        throw new Error('Course ID and Teacher ID are required');
      }
      
      console.log(`Adding teacher ${request.teacherId} to course ${courseId}`);
      const response = await api.post(`/course/${courseId}/teacher/${request.teacherId}`, request);
      
      console.log(`Teacher ${request.teacherId} added to course ${courseId} successfully`);
      return response.data;
    } catch (error) {
      console.error(`Error adding teacher ${request.teacherId} to course ${courseId}:`, error);
      throw error;
    }
  }

  async removeTeacherFromCourse(courseId: string, teacherId: string): Promise<boolean> {
    try {
      if (!courseId || !teacherId) {
        throw new Error('Course ID and Teacher ID are required');
      }
      
      console.log(`Removing teacher ${teacherId} from course ${courseId}`);
      await api.delete(`/course/${courseId}/teacher/${teacherId}`);
      
      console.log(`Teacher ${teacherId} removed from course ${courseId} successfully`);
      return true;
    } catch (error) {
      console.error(`Error removing teacher ${teacherId} from course ${courseId}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper method to normalize course data from the API
   */
  private normalizeCourses(data: any): Course[] {
    // Handle $values format from .NET backend
    if (data && data.$values) {
      return data.$values.filter((item: any) => 
        item && typeof item === 'object' && !item.$ref && item.id
      );
    }
    
    // Handle array format
    if (Array.isArray(data)) {
      return data.filter(item => 
        item && typeof item === 'object' && item.id
      );
    }
    
    return [];
  }
} 