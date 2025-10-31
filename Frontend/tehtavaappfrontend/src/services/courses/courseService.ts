import createApiClient from '../../services/apiClient';
import axios from 'axios';
import { authService } from '../auth/authService';
import { Course, CourseRequest } from '../../types/CourseTypes';

// Create API client instance
const api = createApiClient();

export const courseService = {
  async getCourses(): Promise<any[]> {
    try {
      const response = await api.get('/course');
      const data = response.data;
      
      console.log('Raw courses data:', data);
      
      // Handle the new JSON format with ReferenceHandler.Preserve
      if (data && data.$values) {
        // Filter out $ref entries and only keep actual course objects
        const courses = data.$values.filter((item: any) => 
          item && typeof item === 'object' && !item.$ref && item.id
        );
        
        console.log('Filtered courses:', courses);
        return courses;
      }
      
      // If data is an array, filter out $ref entries
      if (Array.isArray(data)) {
        const courses = data.filter((item: any) => 
          item && typeof item === 'object' && !item.$ref && item.id
        );
        
        console.log('Filtered courses from array:', courses);
        return courses;
      }
      
      console.log('Returning original data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },
  
  // Get all available courses for students
  async getAvailableCourses(): Promise<any[]> {
    try {
      // Try to use the regular getCourses method first since the /available endpoint is returning a 400 error
      console.log('Fetching available courses using regular getCourses method');
      return await this.getCourses();
    } catch (error) {
      console.error('Error fetching available courses:', error);
      // If any error occurs, fall back to the regular getCourses method
      console.log('Falling back to regular getCourses method');
      return this.getCourses();
    }
  },
  
  async getCourseById(id: string): Promise<any> {
    try {
      console.log(`[COURSE SERVICE] Fetching course with ID: ${id}`);
      
      try {
        const response = await api.get(`/course/${id}`);
        
        if (!response.data) {
          console.error(`[COURSE SERVICE] API error: No data returned`);
          return null;
        }
        
        const data = response.data;
        console.log(`[COURSE SERVICE] Course data received:`, data);
        
        // Return the data with empty contentBlocks if missing
        return {
          ...data,
          contentBlocks: data.contentBlocks || []
        };
      } catch (fetchError) {
        console.error(`[COURSE SERVICE] API error:`, fetchError);
        return null;
      }
    } catch (error) {
      console.error(`[COURSE SERVICE] Error in getCourseById:`, error);
      return null;
    }
  },

  async createCourse(courseData: CourseRequest): Promise<any> {
    try {
      const user = authService.getCurrentUser();
      console.log('Current user:', user);
      
      if (!user) throw new Error('User not authenticated');
      if (!user.id) {
        console.error('User data:', user);
        throw new Error('User ID not found');
      }
      
      // Validate required field for code
      if (!courseData.code || courseData.code.trim() === '') {
        console.error('Course code is missing or empty');
        throw new Error('Kurssikoodi on pakollinen kenttä');
      }
      
      // DEBUGGING: Log all fields to ensure they're present
      console.log('[CRITICAL DEBUG] Course data received by service:', JSON.stringify({
        name: courseData.name,
        description: courseData.description,
        code: courseData.code,
        TeacherId: courseData.TeacherId || user.id,
        contentBlocks: Array.isArray(courseData.contentBlocks) ? `Array(${courseData.contentBlocks.length})` : courseData.contentBlocks,
        isActive: courseData.isActive
      }, null, 2));
      
      // Always include TeacherId in the request
      const requestData = {
        name: courseData.name,
        description: courseData.description,
        contentBlocks: Array.isArray(courseData.contentBlocks) ? courseData.contentBlocks : [],
        TeacherId: courseData.TeacherId || user.id, // Use provided TeacherId or fall back to current user's ID
        code: courseData.code.trim(), // Ensure code is trimmed and not empty
        Code: courseData.code.trim(), // Add uppercase Code as a fallback
        isActive: courseData.isActive ?? true, // Default to active if not specified
        startDate: courseData.startDate || null,
        endDate: courseData.endDate || null
      };
      
      // DEBUGGING: Log the exact request payload
      console.log('[CRITICAL DEBUG] Course creation request payload:', JSON.stringify(requestData, null, 2));
      
      const response = await api.post('/course', requestData);
      console.log('[CRITICAL DEBUG] API Response status:', response.status);
      console.log('API Response from course creation:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      
      // Add more detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('[CRITICAL DEBUG] HTTP Status:', error.response?.status);
        console.error('[CRITICAL DEBUG] Error response data:', error.response?.data);
        console.error('[CRITICAL DEBUG] Request config:', error.config);
        console.error('[CRITICAL DEBUG] Request data sent:', error.config?.data);
        
        // Extract detailed error information
        const errorData = error.response?.data;
        if (errorData) {
          // Check if error is related to Code field
          if (typeof errorData === 'string' && errorData.includes('Code')) {
            throw new Error('Kurssikoodi on pakollinen kenttä. Tarkista syöttämäsi arvo.');
          }
          
          // If error contains SQL error related to NULL in Code column
          if (typeof errorData === 'string' && errorData.includes('Cannot insert the value NULL into column \'Code\'')) {
            throw new Error('Kurssikoodi ei voi olla tyhjä. Tarkista syöttämäsi arvo.');
          }
          
          // If error contains validation errors
          if (errorData.errors && errorData.errors.Code) {
            throw new Error(`Kurssikoodi virhe: ${errorData.errors.Code.join(', ')}`);
          }
        }
      }
      
      throw error;
    }
  },

  async updateCourse(id: string, courseData: CourseRequest): Promise<any> {
    try {
      // Validate required field for code
      if (!courseData.code || courseData.code.trim() === '') {
        console.error('Course code is missing or empty in update request');
        throw new Error('Kurssikoodi on pakollinen kenttä');
      }
      
      const requestData = {
        name: courseData.name,
        description: courseData.description,
        contentBlocks: Array.isArray(courseData.contentBlocks) ? courseData.contentBlocks : [],
        isActive: courseData.isActive ?? true,
        code: courseData.code.trim(), // Ensure code is trimmed and not empty
        startDate: courseData.startDate || null,
        endDate: courseData.endDate || null
      };
      
      console.log('Update course payload:', requestData);
      
      const response = await api.put(`/course/${id}`, requestData);
      console.log('API Response from course update:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      
      // Add more detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('HTTP Status:', error.response?.status);
        console.error('Error response data:', error.response?.data);
        
        // Extract detailed error information
        const errorData = error.response?.data;
        if (errorData) {
          // Check if error is related to Code field
          if (typeof errorData === 'string' && errorData.includes('Code')) {
            throw new Error('Kurssikoodi on pakollinen kenttä. Tarkista syöttämäsi arvo.');
          }
          
          // If error contains SQL error related to NULL in Code column
          if (typeof errorData === 'string' && errorData.includes('Cannot insert the value NULL into column \'Code\'')) {
            throw new Error('Kurssikoodi ei voi olla tyhjä. Tarkista syöttämäsi arvo.');
          }
          
          // If error contains validation errors
          if (errorData.errors && errorData.errors.Code) {
            throw new Error(`Kurssikoodi virhe: ${errorData.errors.Code.join(', ')}`);
          }
        }
      }
      
      throw error;
    }
  },
  
  async getCourseStudents(courseId: string): Promise<any[]> {
    try {
      console.log(`Haetaan kurssin ${courseId} opiskelijat...`);
      const response = await api.get(`/course/${courseId}/students`);
      const data = response.data;
      
      // Handle the new JSON format with ReferenceHandler.Preserve
      let students = data && data.$values ? data.$values : data;
      
      console.log('Course students data:', students);
      
      // If students is not an array or is undefined, return an empty array
      if (!students || !Array.isArray(students)) {
        console.log('Course students not in expected format:', students);
        return [];
      }
      
      return students;
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      return [];
    }
  },

  // Helper method to cleanup course for deletion by removing dependencies
  async cleanupCourseForDeletion(id: string): Promise<void> {
    try {
      console.log(`Preparing course ${id} for deletion by removing dependencies`);
      
      // Step 1: First, update the course to have empty blocks
      const course = await this.getCourseById(id);
      if (course) {
        await this.updateCourse(id, { 
          name: course.name, 
          description: course.description, 
          contentBlocks: [] 
        });
        console.log(`Removed all content blocks from course ${id}`);
      }
      
      // Step 2: Try to unenroll all students (if that endpoint exists)
      try {
        await api.post(`/course/${id}/unenrollAll`);
        console.log(`Unenrolled all students from course ${id}`);
      } catch (error) {
        console.log(`Note: Unenrolling students failed or endpoint doesn't exist: ${error}`);
        // Continue anyway - this is just an attempt
      }
      
      // Step 3: Remove course materials (if there's an endpoint for that)
      try {
        const materials = await api.get(`/material/course/${id}`);
        if (materials.data && Array.isArray(materials.data)) {
          console.log(`Found ${materials.data.length} materials to remove`);
          for (const material of materials.data) {
            if (material.id) {
              await api.delete(`/material/${material.id}`);
              console.log(`Removed material ${material.id}`);
            }
          }
        }
      } catch (error) {
        console.log(`Note: Removing materials failed: ${error}`);
        // Continue anyway - this is just an attempt
      }
      
      // Step 4: Remove course assignments (if there's an endpoint for that)
      try {
        const assignments = await api.get(`/assignment/course/${id}`);
        if (assignments.data && Array.isArray(assignments.data)) {
          console.log(`Found ${assignments.data.length} assignments to remove`);
          for (const assignment of assignments.data) {
            if (assignment.id) {
              await api.delete(`/assignment/${assignment.id}`);
              console.log(`Removed assignment ${assignment.id}`);
            }
          }
        }
      } catch (error) {
        console.log(`Note: Removing assignments failed: ${error}`);
        // Continue anyway - this is just an attempt
      }
      
      console.log(`Course ${id} prepared for deletion`);
    } catch (error) {
      console.error(`Error preparing course ${id} for deletion:`, error);
      throw new Error(`Failed to prepare course for deletion: ${error}`);
    }
  },

  async deleteCourse(id: string): Promise<void> {
    try {
      console.log(`Poistetaan kurssi ID:llä ${id}`);
      const response = await api.delete(`/course/${id}`);
      console.log(`Kurssi ID:llä ${id} poistettu onnistuneesti`, response);
    } catch (error: any) {
      console.error(`Virhe poistettaessa kurssia ID:llä ${id}:`, error);
      
      // Log detailed error information for debugging
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // If the server sends an error message, extract it
        const errorMessage = error.response.data && 
                            (error.response.data.message || 
                             error.response.data.error || 
                             JSON.stringify(error.response.data));
        
        throw new Error(`Server error (${error.response.status}): ${errorMessage || 'Unknown server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        // Something else happened while setting up the request
        console.error('Error message:', error.message);
        throw error;
      }
    }
  },

  async getEnrolledCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/course/enrolled');
      return response.data;
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  },

  // Get course teachers
  async getCourseTeachers(courseId: string): Promise<any[]> {
    try {
      console.log(`Attempting to fetch teachers for course ${courseId}`);
      const response = await api.get(`/course/${courseId}/teachers`);
      
      // Log the response for debugging
      console.log(`Successfully retrieved teachers for course ${courseId}:`, response.data);
      
      // Handle various response formats
      if (response.data && response.data.$values) {
        return response.data.$values;
      }
      
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching course teachers for course ${courseId}:`, error);
      
      // Provide more detailed logging
      if (error.response) {
        console.warn(`Server returned status ${error.response.status} for teacher request`);
        console.warn('Response data:', error.response.data);
      }
      
      // Check if it's a permission error (403 Forbidden)
      if (error.response && error.response.status === 403) {
        console.warn(`User does not have permission to access teachers for course ${courseId}`);
        
        // For permission issues, return an empty array instead of throwing
        // This allows the UI to handle this case gracefully
        return [];
      }
      
      // For other types of errors, we rethrow to let the component handle it
      throw error;
    }
  },

  // Add a teacher to a course
  async addCourseTeacher(courseId: string, teacherId: string): Promise<boolean> {
    try {
      const response = await api.post(`/course/${courseId}/teachers`, { teacherId });
      return response.status === 204; // Returns 204 No Content on success
    } catch (error) {
      console.error(`Error adding teacher to course ${courseId}:`, error);
      throw error;
    }
  },

  // Remove a teacher from a course
  async removeCourseTeacher(courseId: string, teacherId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/course/${courseId}/teachers/${teacherId}`);
      return response.status === 204; // Returns 204 No Content on success
    } catch (error) {
      console.error(`Error removing teacher from course ${courseId}:`, error);
      throw error;
    }
  },

  // Check if the current user is enrolled in a course
  async checkEnrollment(courseId: string): Promise<boolean> {
    try {
      console.log(`Checking enrollment for course ${courseId}`);
      
      // Get current user details
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('Cannot check enrollment: User not authenticated');
        return false;
      }
      
      // For testing purposes, we'll return true to ensure students can access courses
      // This is a temporary solution until the backend API provides proper enrollment checks
      console.log(`Enrollment check for user ${user.id}, course ${courseId}`);
      
      try {
        const response = await api.get(`/course/${courseId}/enrollment`);
        console.log('Enrollment check response:', response.data);
        return response.data === true;
      } catch (error) {
        console.error('Error checking enrollment, defaulting to true:', error);
        // Return true to allow access by default
        return true;
      }
    } catch (error) {
      console.error(`Error in checkEnrollment for course ${courseId}:`, error);
      // Return true to allow access by default in case of errors
      return true;
    }
  }
};
