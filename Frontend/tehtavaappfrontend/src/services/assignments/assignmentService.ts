import createApiClient from '../apiClient';
import axios from 'axios';
import { Assignment } from '../../types/assignment';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import {
  cacheAssignmentFiles,
  getCachedAssignmentFiles,
  invalidateCacheByPrefix,
  cacheItem,
  getCachedItem
} from '../../utils/cacheUtils';

// Cache prefixes
const ASSIGNMENT_CACHE_PREFIX = 'assignment-';
const COURSE_ASSIGNMENTS_PREFIX = 'course-assignments-';
const STUDENT_ASSIGNMENTS_PREFIX = 'student-assignments-';
const ASSIGNMENT_FILES_PREFIX = 'assignment-files-';

// Cache TTLs
const ASSIGNMENTS_TTL = 3 * 60 * 60 * 1000; // 3 hours for assignments
const ASSIGNMENT_FILES_TTL = 6 * 60 * 60 * 1000; // 6 hours for assignment files

// Create API client instance 
const api = createApiClient();

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

export interface IAssignment {
  id: string;
  title: string;
  description: string;
  contentMarkdown?: string;
  courseId: string;
  dueDate: string;
  points?: number;
  status?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateAssignmentRequest {
  title: string;
  description: string;
  contentMarkdown?: string;
  courseId: string;
  dueDate: string;
  points?: number;
}

export interface IUpdateAssignmentRequest {
  id: string;
  title: string;
  description: string;
  contentMarkdown?: string;
  dueDate: string;
  status?: string;
  points?: number;
}

class AssignmentService {
  async getAssignments(forceRefresh = false): Promise<Assignment[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAssignments = await getCachedItem<Assignment[]>(`${ASSIGNMENT_CACHE_PREFIX}all`);
        if (cachedAssignments) {
          console.log('[AssignmentService] Using cached assignments');
          return cachedAssignments;
        }
      }

      console.log('[ASSIGNMENT SERVICE] Fetching assignments');
      const response = await api.get<Assignment[]>('/assignment');
      console.log(`[AssignmentService] Successfully fetched ${response.data.length} assignments`);
      
      if (response.data.length > 0) {
        console.log('[AssignmentService] Sample assignments from getAssignments:', 
          response.data.slice(0, 2).map(a => ({
            id: a.id,
            title: a.title,
            status: a.status,
            statusType: typeof a.status
          }))
        );
      }
      
      // Ensure all assignments have properly formatted status
      const processedAssignments = response.data.map(assignment => {
        // Make a copy to avoid modifying the original object
        const processedAssignment = { ...assignment };
        
        // If status is missing or not properly formatted, add a default
        if (!processedAssignment.status) {
          console.log(`[AssignmentService] Assignment ${processedAssignment.id} has no status, setting default`);
          processedAssignment.status = 'Published';
        }
        
        return processedAssignment;
      });
      
      // Cache the assignments
      await cacheItem(`${ASSIGNMENT_CACHE_PREFIX}all`, processedAssignments, ASSIGNMENTS_TTL);
      
      return processedAssignments;
    } catch (error) {
      console.error('[AssignmentService] Error fetching assignments:', error);
      throw error;
    }
  }

  async getAssignmentById(id: string, forceRefresh = false): Promise<Assignment | null> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAssignment = await getCachedItem<Assignment>(`${ASSIGNMENT_CACHE_PREFIX}${id}`);
        if (cachedAssignment) {
          console.log(`[AssignmentService] Using cached assignment for id ${id}`);
          return cachedAssignment;
        }
      }

      console.log(`[AssignmentService] Fetching assignment with ID: ${id}`);
      const response = await api.get<Assignment>(`/assignment/${id}`);
      console.log(`[AssignmentService] Successfully fetched assignment:`, {
        id: response.data.id,
        title: response.data.title,
        status: response.data.status,
        statusType: typeof response.data.status
      });
      
      // Ensure assignment has properly formatted status
      const processedAssignment = { ...response.data };
      
      // If status is missing or not properly formatted, add a default
      if (!processedAssignment.status) {
        console.log(`[AssignmentService] Assignment ${processedAssignment.id} has no status, setting default`);
        processedAssignment.status = 'Published';
      }
      
      // Cache the assignment
      await cacheItem(`${ASSIGNMENT_CACHE_PREFIX}${id}`, processedAssignment, ASSIGNMENTS_TTL);
      
      return processedAssignment;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching assignment with ID ${id}:`, error);
      return null;
    }
  }

  async getAssignmentsByCourse(courseId: string, forceRefresh = false): Promise<Assignment[]> {
    try {
      // Validate courseId
      if (!courseId || typeof courseId !== 'string') {
        console.error(`[AssignmentService] Invalid courseId: ${courseId} (type: ${typeof courseId})`);
        return [];
      }
      
      // Trim and sanitize the courseId
      const trimmedCourseId = courseId.trim();
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAssignments = await getCachedItem<Assignment[]>(`${COURSE_ASSIGNMENTS_PREFIX}${trimmedCourseId}`);
        if (cachedAssignments) {
          console.log(`[AssignmentService] Using cached assignments for course ${trimmedCourseId}`);
          return cachedAssignments;
        }
      }
      
      console.log(`[AssignmentService] Fetching assignments for course ${trimmedCourseId}`);
      console.log(`[AssignmentService] API request path: /assignment/course/${trimmedCourseId}`);
      
      // Make the API call
      const response = await api.get<Assignment[]>(`/assignment/course/${trimmedCourseId}`);
      
      console.log(`[AssignmentService] Successfully fetched ${response.data.length} assignments for course ${trimmedCourseId}`);
      console.log(`[AssignmentService] First few assignments:`, response.data.slice(0, 3));
      
      // Ensure all assignments have properly formatted status
      const processedAssignments = response.data.map(assignment => {
        // Make a copy to avoid modifying the original object
        const processedAssignment = { ...assignment };
        
        // If status is missing or not properly formatted, add a default
        if (!processedAssignment.status) {
          console.log(`[AssignmentService] Assignment ${processedAssignment.id} has no status, setting default`);
          processedAssignment.status = 'Published';
        }
        
        return processedAssignment;
      });
      
      // Cache the assignments
      await cacheItem(`${COURSE_ASSIGNMENTS_PREFIX}${trimmedCourseId}`, processedAssignments, ASSIGNMENTS_TTL);
      
      return processedAssignments;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching assignments for course ${courseId}:`, error);
      
      // Add more detailed error information
      if (axios.isAxiosError(error)) {
        console.error(`[AssignmentService] HTTP status: ${error.response?.status}`);
        console.error(`[AssignmentService] Response data:`, error.response?.data);
      }
      
      return [];
    }
  }

  async createAssignment(assignmentData: ICreateAssignmentRequest): Promise<Assignment> {
    try {
      console.log('[AssignmentService] Creating assignment:', assignmentData);
      
      // Ensure courseId is valid
      if (!assignmentData.courseId) {
        console.error('[AssignmentService] Cannot create assignment without courseId');
        throw new Error('Kurssin ID vaaditaan tehtävän luomiseksi');
      }
      
      const response = await api.post<Assignment>('/assignment', assignmentData);
      console.log('[AssignmentService] Assignment created successfully:', response.data);
      
      // Invalidate related caches
      await invalidateCacheByPrefix(`${ASSIGNMENT_CACHE_PREFIX}all`);
      await invalidateCacheByPrefix(`${COURSE_ASSIGNMENTS_PREFIX}${assignmentData.courseId}`);
      
      return response.data;
    } catch (error) {
      console.error('[AssignmentService] Error creating assignment:', error);
      
      // Add more detailed error information
      if (axios.isAxiosError(error)) {
        console.error(`[AssignmentService] HTTP status: ${error.response?.status}`);
        console.error(`[AssignmentService] Response data:`, error.response?.data);
      }
      
      throw error;
    }
  }

  async updateAssignment(assignmentData: IUpdateAssignmentRequest): Promise<Assignment> {
    try {
      const response = await api.put<Assignment>(`/assignment/${assignmentData.id}`, assignmentData);
      
      // Invalidate related caches
      await invalidateCacheByPrefix(`${ASSIGNMENT_CACHE_PREFIX}${assignmentData.id}`);
      await invalidateCacheByPrefix(`${ASSIGNMENT_CACHE_PREFIX}all`);
      
      // If we have courseId, invalidate course assignments cache
      if (response.data.courseId) {
        await invalidateCacheByPrefix(`${COURSE_ASSIGNMENTS_PREFIX}${response.data.courseId}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('[AssignmentService] Error updating assignment:', error);
      throw error;
    }
  }

  async deleteAssignment(id: string): Promise<void> {
    try {
      // Get the assignment data to find its courseId before it's deleted
      const assignment = await this.getAssignmentById(id);
      const courseId = assignment?.courseId;
      
      await api.delete(`/assignment/${id}`);
      
      // Invalidate related caches
      await invalidateCacheByPrefix(`${ASSIGNMENT_CACHE_PREFIX}${id}`);
      await invalidateCacheByPrefix(`${ASSIGNMENT_CACHE_PREFIX}all`);
      
      // If we have courseId, invalidate course assignments cache
      if (courseId) {
        await invalidateCacheByPrefix(`${COURSE_ASSIGNMENTS_PREFIX}${courseId}`);
      }
    } catch (error) {
      console.error('[AssignmentService] Error deleting assignment:', error);
      throw error;
    }
  }

  async addAssignmentToCourse(assignmentId: string, courseId: string): Promise<Assignment> {
    const assignment = await this.getAssignmentById(assignmentId);
    if (!assignment) throw new Error(`Assignment not found with ID: ${assignmentId}`);
    
    // Update the assignment with the new courseId
    const updatedAssignment = { ...assignment, courseId };
    return this.updateAssignment(updatedAssignment as IUpdateAssignmentRequest);
  }

  async getStudentAssignments(studentId: string, forceRefresh = false): Promise<Assignment[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAssignments = await getCachedItem<Assignment[]>(`${STUDENT_ASSIGNMENTS_PREFIX}${studentId}`);
        if (cachedAssignments) {
          console.log(`[AssignmentService] Using cached assignments for student ${studentId}`);
          return cachedAssignments;
        }
      }
      
      console.log(`[AssignmentService] Fetching assignments for student ${studentId}`);
      const response = await api.get<Assignment[]>(`/assignment/student/${studentId}`);
      
      // Process and remove duplicates
      const uniqueAssignments = this.removeDuplicateAssignments(response.data);
      
      // Add default status if missing
      const processedAssignments = uniqueAssignments.map(assignment => {
        return {
          ...assignment,
          status: assignment.status || 'Published'
        };
      });
      
      // Cache the student assignments
      await cacheItem(`${STUDENT_ASSIGNMENTS_PREFIX}${studentId}`, processedAssignments, ASSIGNMENTS_TTL);
      
      return processedAssignments;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching assignments for student ${studentId}:`, error);
      return [];
    }
  }

  async getAssignmentFiles(assignmentId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedFiles = await getCachedAssignmentFiles(assignmentId);
        if (cachedFiles) {
          console.log(`[AssignmentService] Using cached files for assignment ${assignmentId}`);
          return cachedFiles;
        }
      }

      console.log(`[AssignmentService] Fetching files for assignment ${assignmentId}`);
      const response = await api.get<any[]>(`/assignment/${assignmentId}/files`);
      const files = response.data;

      // Cache the files
      await cacheAssignmentFiles(assignmentId, files);

      return files;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching files for assignment ${assignmentId}:`, error);
      return [];
    }
  }

  async getAssignmentFileContent(assignmentId: string, fileId: string, forceRefresh = false): Promise<Blob | null> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedContent = await getCachedItem<Blob>(`${ASSIGNMENT_FILES_PREFIX}${assignmentId}-file-${fileId}`);
        if (cachedContent) {
          console.log(`[AssignmentService] Using cached file content for assignment ${assignmentId}, file ${fileId}`);
          return cachedContent;
        }
      }

      console.log(`[AssignmentService] Fetching file content for assignment ${assignmentId}, file ${fileId}`);
      const response = await api.get(`/assignment/${assignmentId}/files/${fileId}/content`, {
        responseType: 'blob'
      });
      const content = response.data as Blob;

      // Cache the file content
      await cacheItem(`${ASSIGNMENT_FILES_PREFIX}${assignmentId}-file-${fileId}`, content, ASSIGNMENT_FILES_TTL);

      return content;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching file content for assignment ${assignmentId}, file ${fileId}:`, error);
      return null;
    }
  }

  async uploadAssignmentFile(assignmentId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/assignment/${assignmentId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Invalidate files cache for this assignment
      await invalidateCacheByPrefix(`${ASSIGNMENT_FILES_PREFIX}${assignmentId}`);

      return response.data;
    } catch (error) {
      console.error(`[AssignmentService] Error uploading file for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  async getSubmissionsByAssignment(assignmentId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedSubmissions = await getCachedItem<any[]>(`${ASSIGNMENT_CACHE_PREFIX}${assignmentId}-submissions`);
        if (cachedSubmissions) {
          console.log(`[AssignmentService] Using cached submissions for assignment ${assignmentId}`);
          return cachedSubmissions;
        }
      }

      const response = await api.get(`/submission/assignment/${assignmentId}`);
      const submissions = response.data;

      // Cache the submissions
      await cacheItem(`${ASSIGNMENT_CACHE_PREFIX}${assignmentId}-submissions`, submissions, ASSIGNMENTS_TTL);

      return submissions;
    } catch (error) {
      console.error(`[AssignmentService] Error fetching submissions for assignment ${assignmentId}:`, error);
      return [];
    }
  }

  async getTeacherAssignments(forceRefresh = false): Promise<Assignment[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAssignments = await getCachedItem<Assignment[]>(`${ASSIGNMENT_CACHE_PREFIX}teacher`);
        if (cachedAssignments) {
          console.log('[AssignmentService] Using cached teacher assignments');
          return cachedAssignments;
        }
      }

      const response = await api.get<Assignment[]>('/assignment/teacher');
      const assignments = response.data;

      // Cache the teacher assignments
      await cacheItem(`${ASSIGNMENT_CACHE_PREFIX}teacher`, assignments, ASSIGNMENTS_TTL);

      return assignments;
    } catch (error) {
      console.error('[AssignmentService] Error fetching teacher assignments:', error);
      if (axios.isAxiosError(error)) {
        // If unauthorized (401) or access denied (403), return empty array with less noise
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('[AssignmentService] Access denied for teacher assignments');
          return [];
        }
      }
      
      throw error;
    }
  }

  /**
   * Removes duplicate assignments based on ID
   * @param assignments - Array of assignments that may contain duplicates
   * @returns Array of unique assignments
   */
  private removeDuplicateAssignments(assignments: Assignment[]): Assignment[] {
    const uniqueMap = new Map<string, Assignment>();
    
    assignments.forEach(assignment => {
      if (assignment.id) {
        uniqueMap.set(assignment.id, assignment);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets assignments for multiple courses.
   * @param courseIds - Array of course IDs to get assignments for
   * @param forceRefresh - Whether to bypass the cache and fetch from API
   * @returns List of all assignments for the specified courses
   */
  async getAssignmentsForCourses(courseIds: string[], forceRefresh = false): Promise<Assignment[]> {
    try {
      if (!courseIds || courseIds.length === 0) {
        console.log('[AssignmentService] No course IDs provided, returning empty array');
        return [];
      }

      console.log(`[AssignmentService] Fetching assignments for ${courseIds.length} courses`);
      
      // Try to get cached assignments for all courses if not forcing refresh
      if (!forceRefresh) {
        const cacheKey = `assignments_courses_${courseIds.sort().join('_')}`;
        const cachedAssignments = await getCachedItem<Assignment[]>(cacheKey);
        
        if (cachedAssignments) {
          console.log(`[AssignmentService] Using cached assignments for ${courseIds.length} courses`, cachedAssignments.length);
          return cachedAssignments;
        }
      }
      
      // Fetch assignments for each course in parallel
      const assignmentPromises = courseIds.map(courseId => this.getAssignmentsByCourse(courseId, forceRefresh));
      const coursesAssignments = await Promise.all(assignmentPromises);
      
      // Flatten the results and remove duplicates by ID
      const allAssignments = coursesAssignments.flat();
      const uniqueAssignments = this.removeDuplicateAssignments(allAssignments);
      
      // Cache the combined results
      if (uniqueAssignments.length > 0) {
        const cacheKey = `assignments_courses_${courseIds.sort().join('_')}`;
        await cacheItem(cacheKey, uniqueAssignments);
        console.log(`[AssignmentService] Cached ${uniqueAssignments.length} assignments for ${courseIds.length} courses`);
      }
      
      return uniqueAssignments;
    } catch (error) {
      console.error('[AssignmentService] Error fetching assignments for multiple courses:', error);
      return [];
    }
  }
}

export const assignmentService = new AssignmentService();