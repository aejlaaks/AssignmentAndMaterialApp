import axios from 'axios';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { IGroupService, CreateGroupRequest, UpdateGroupRequest, AddCourseToGroupResponse } from '../../interfaces/services/IGroupService';
import { SchoolGroup } from '../../interfaces/models/SchoolGroup';
import { Student } from '../../interfaces/models/Student';
import { getUsersByRole } from '../users/userService';
import { UserRole } from '../../types';
import { ISchoolGroup, IStudentGroupEnrollment } from '../courses/groupService';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
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
 * Concrete implementation of the IGroupService interface
 * Following Single Responsibility Principle by handling only group-related operations
 */
export class GroupServiceImpl implements IGroupService {
  async getGroups(): Promise<ISchoolGroup[]> {
    try {
      const response = await api.get('/group');
      console.log('Retrieved groups:', response.data);
      return this.normalizeGroups(response.data) as unknown as ISchoolGroup[];
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  async getGroupById(id: string): Promise<SchoolGroup | null> {
    try {
      if (!id) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Fetching group ${id}`);
      const response = await api.get(`/group/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      return null;
    }
  }

  async getGroupsByCourse(courseId: string): Promise<ISchoolGroup[]> {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      console.log(`Fetching groups for course ${courseId}`);
      const response = await api.get(`/group/course/${courseId}`);
      return this.normalizeGroups(response.data) as unknown as ISchoolGroup[];
    } catch (error) {
      console.error(`Error fetching groups for course ${courseId}:`, error);
      throw error;
    }
  }

  async createGroup(groupData: CreateGroupRequest): Promise<ISchoolGroup> {
    try {
      console.log('Creating group:', groupData);
      const response = await api.post('/group', groupData);
      return response.data as unknown as ISchoolGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async updateGroup(id: string, groupData: UpdateGroupRequest): Promise<ISchoolGroup> {
    try {
      if (!id) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Updating group ${id}:`, groupData);
      const response = await api.put(`/group/${id}`, groupData);
      return response.data as unknown as ISchoolGroup;
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      throw error as any;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Deleting group ${groupId}`);
      await api.delete(`/group/${groupId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting group ${groupId}:`, error);
      return false;
    }
  }

  async addCourseToGroup(groupId: string, courseId: string): Promise<AddCourseToGroupResponse> {
    try {
      if (!groupId || !courseId) {
        throw new Error('Group ID and Course ID are required');
      }
      
      console.log(`Adding course ${courseId} to group ${groupId}`);
      const response = await api.post(`/group/${groupId}/course/${courseId}`);
      return { 
        success: true,
        enrolledStudents: response.data.enrolledStudents || []
      };
    } catch (error: any) {
      console.error(`Error adding course ${courseId} to group ${groupId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to add course to group'
      };
    }
  }

  async removeCourseFromGroup(groupId: string, courseId: string): Promise<{ success: boolean, error?: string }> {
    try {
      if (!groupId || !courseId) {
        throw new Error('Group ID and Course ID are required');
      }
      
      console.log(`Removing course ${courseId} from group ${groupId}`);
      await api.delete(`/group/${groupId}/courses/${courseId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`Error removing course ${courseId} from group ${groupId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to remove course from group'
      };
    }
  }

  async getGroupWithStudents(groupId: string): Promise<ISchoolGroup> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Fetching group ${groupId} with students`);
      const response = await api.get(`/group/${groupId}/students`);
      
      // Normalize the response
      const group = response.data;
      
      // Ensure students array exists
      if (!group.students) {
        group.students = [];
      }
      
      return group as unknown as ISchoolGroup;
    } catch (error) {
      console.error(`Error fetching group ${groupId} with students:`, error);
      throw error;
    }
  }

  async getAvailableStudents(groupId: string): Promise<Student[]> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Fetching available students for group ${groupId}`);
      const response = await api.get(`/group/${groupId}/available-students`);
      
      // If the endpoint doesn't exist, fall back to getting all students
      if (response.status === 404) {
        console.log('Available students endpoint not found, falling back to all students');
        return await this.getAllStudents();
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching available students for group ${groupId}:`, error);
      
      // Fall back to getting all students
      try {
        console.log('Falling back to getting all students');
        return await this.getAllStudents();
      } catch (innerError) {
        console.error('Error fetching all students:', innerError);
        return [];
      }
    }
  }

  async addStudentToGroup(groupId: string, studentId: string): Promise<boolean> {
    try {
      if (!groupId || !studentId) {
        throw new Error('Group ID and Student ID are required');
      }
      
      console.log(`Adding student ${studentId} to group ${groupId}`);
      await api.post(`/group/${groupId}/student/${studentId}`);
      return true;
    } catch (error: any) {
      console.error(`Error adding student ${studentId} to group ${groupId}:`, error);
      // Need to return boolean type as per interface
      return false;
    }
  }

  async removeStudentFromGroup(groupId: string, studentId: string): Promise<boolean> {
    try {
      if (!groupId || !studentId) {
        throw new Error('Group ID and Student ID are required');
      }
      
      console.log(`Removing student ${studentId} from group ${groupId}`);
      await api.delete(`/group/${groupId}/student/${studentId}`);
      return true;
    } catch (error: any) {
      console.error(`Error removing student ${studentId} from group ${groupId}:`, error);
      // Need to return boolean type as per interface
      return false;
    }
  }

  async getGroupEnrollments(groupId: string): Promise<IStudentGroupEnrollment[]> {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      
      console.log(`Fetching enrollments for group ${groupId}`);
      const response = await api.get(`/group/${groupId}/enrollments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching enrollments for group ${groupId}:`, error);
      return [];
    }
  }

  /**
   * Get assignment statistics for a student in a course
   */
  async getStudentAssignmentStats(studentId: string, courseId: string): Promise<{
    studentId: string;
    courseId: string;
    totalAssignments: number;
    submittedAssignments: number;
    submissionRate: number;
  } | null> {
    try {
      if (!studentId || !courseId) {
        throw new Error('Student ID and Course ID are required');
      }
      
      console.log(`Fetching assignment stats for student ${studentId} in course ${courseId}`);
      const response = await api.get(`/student/${studentId}/assignments/stats?courseId=${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching assignment stats for student ${studentId} in course ${courseId}:`, error);
      return null;
    }
  }

  /**
   * Helper method to normalize group data from the API
   */
  private normalizeGroups(data: any): SchoolGroup[] {
    // Handle $values format from .NET backend
    if (data && data.$values) {
      return data.$values.filter((item: any) => item && typeof item === 'object');
    }
    
    // Handle array format
    if (Array.isArray(data)) {
      return data.filter(item => item && typeof item === 'object');
    }
    
    return [];
  }
  
  /**
   * Helper method to get all students from the user service
   */
  private async getAllStudents(): Promise<Student[]> {
    try {
      // Get all users with student role
      const students = await getUsersByRole(UserRole.Student);
      
      // Convert to our Student type
      return students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        userName: student.email,
        name: `${student.firstName} ${student.lastName}`,
        role: UserRole.Student
      }));
    } catch (error) {
      console.error('Error fetching all students:', error);
      return [];
    }
  }

  /**
   * Get student IDs for a course
   * @param courseId The course ID to get student IDs for
   * @returns Array of student IDs
   */
  async getCourseStudentIds(courseId: number): Promise<string[]> {
    try {
      const response = await api.get(`/courses/${courseId}/students/ids`);
      return response.data;
    } catch (error) {
      console.error(`Error getting student IDs for course ${courseId}:`, error);
      return [];
    }
  }
} 