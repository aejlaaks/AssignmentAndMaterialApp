import { groupService, ISchoolGroup, IStudent, IStudentGroupEnrollment } from './groupService';
import { cacheItem, getCachedItem, invalidateCacheByPrefix } from '../../utils/cacheUtils';

// Cache prefixes
const GROUP_CACHE_PREFIX = 'group-';
const ALL_GROUPS_CACHE_KEY = 'all-groups';
const COURSE_GROUPS_PREFIX = 'course-groups-';
const GROUP_STUDENTS_PREFIX = 'group-students-';
const GROUP_ENROLLMENTS_PREFIX = 'group-enrollments-';

// Cache TTLs
const GROUPS_TTL = 3 * 60 * 60 * 1000; // 3 hours for groups
const STUDENT_DATA_TTL = 6 * 60 * 60 * 1000; // 6 hours for student data

// Extended groupService with caching capabilities
export const groupServiceWithCache = {
  ...groupService,
  
  // Get all groups with caching
  async getGroups(forceRefresh = false): Promise<ISchoolGroup[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedGroups = await getCachedItem<ISchoolGroup[]>(`${GROUP_CACHE_PREFIX}${ALL_GROUPS_CACHE_KEY}`);
        if (cachedGroups) {
          console.log('[GroupService] Using cached groups');
          return cachedGroups;
        }
      }

      // Fetch fresh data
      const groups = await groupService.getGroups();
      
      // Cache the result
      await cacheItem(`${GROUP_CACHE_PREFIX}${ALL_GROUPS_CACHE_KEY}`, groups, GROUPS_TTL);
      
      return groups;
    } catch (error) {
      console.error('[GroupService] Error in getGroups with cache:', error);
      throw error;
    }
  },

  // Get groups by course with caching
  async getGroupsByCourse(courseId: string, forceRefresh = false): Promise<ISchoolGroup[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedGroups = await getCachedItem<ISchoolGroup[]>(`${COURSE_GROUPS_PREFIX}${courseId}`);
        if (cachedGroups) {
          console.log(`[GroupService] Using cached groups for course ${courseId}`);
          return cachedGroups;
        }
      }

      // Fetch fresh data
      const groups = await groupService.getGroupsByCourse(courseId);
      
      // Cache the result
      await cacheItem(`${COURSE_GROUPS_PREFIX}${courseId}`, groups, GROUPS_TTL);
      
      return groups;
    } catch (error) {
      console.error(`[GroupService] Error in getGroupsByCourse with cache for course ${courseId}:`, error);
      throw error;
    }
  },

  // Get group by ID with caching
  async getGroupById(id: string, forceRefresh = false): Promise<ISchoolGroup> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedGroup = await getCachedItem<ISchoolGroup>(`${GROUP_CACHE_PREFIX}${id}`);
        if (cachedGroup) {
          console.log(`[GroupService] Using cached group for ID ${id}`);
          return cachedGroup;
        }
      }

      // Fetch fresh data
      const group = await groupService.getGroupById(id);
      
      // Cache the result
      await cacheItem(`${GROUP_CACHE_PREFIX}${id}`, group, GROUPS_TTL);
      
      return group;
    } catch (error) {
      console.error(`[GroupService] Error in getGroupById with cache for ID ${id}:`, error);
      throw error;
    }
  },

  // Get group with students with caching
  async getGroupWithStudents(groupId: string, forceRefresh = false): Promise<ISchoolGroup | null> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedGroup = await getCachedItem<ISchoolGroup | null>(`${GROUP_STUDENTS_PREFIX}${groupId}`);
        if (cachedGroup) {
          console.log(`[GroupService] Using cached group with students for ID ${groupId}`);
          return cachedGroup;
        }
      }

      // Fetch fresh data
      const group = await groupService.getGroupWithStudents(groupId);
      
      if (group) {
        // Cache the result
        await cacheItem(`${GROUP_STUDENTS_PREFIX}${groupId}`, group, STUDENT_DATA_TTL);
      }
      
      return group;
    } catch (error) {
      console.error(`[GroupService] Error in getGroupWithStudents with cache for ID ${groupId}:`, error);
      throw error;
    }
  },

  // Get group enrollments with caching
  async getGroupEnrollments(groupId: string, forceRefresh = false): Promise<IStudentGroupEnrollment[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedEnrollments = await getCachedItem<IStudentGroupEnrollment[]>(
          `${GROUP_ENROLLMENTS_PREFIX}${groupId}`
        );
        if (cachedEnrollments) {
          console.log(`[GroupService] Using cached enrollments for group ${groupId}`);
          return cachedEnrollments;
        }
      }

      // Fetch fresh data
      const enrollments = await groupService.getGroupEnrollments(groupId);
      
      // Cache the result
      await cacheItem(`${GROUP_ENROLLMENTS_PREFIX}${groupId}`, enrollments, STUDENT_DATA_TTL);
      
      return enrollments;
    } catch (error) {
      console.error(`[GroupService] Error in getGroupEnrollments with cache for group ${groupId}:`, error);
      throw error;
    }
  },

  // Get available students with caching
  async getAvailableStudents(groupId: string, forceRefresh = false): Promise<IStudent[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedStudents = await getCachedItem<IStudent[]>(`${GROUP_CACHE_PREFIX}available-students-${groupId}`);
        if (cachedStudents) {
          console.log(`[GroupService] Using cached available students for group ${groupId}`);
          return cachedStudents;
        }
      }

      // Fetch fresh data
      const students = await groupService.getAvailableStudents(groupId);
      
      // Cache the result
      await cacheItem(`${GROUP_CACHE_PREFIX}available-students-${groupId}`, students, STUDENT_DATA_TTL);
      
      return students;
    } catch (error) {
      console.error(`[GroupService] Error in getAvailableStudents with cache for group ${groupId}:`, error);
      throw error;
    }
  },

  // Create group with cache invalidation
  async createGroup(groupData: any): Promise<ISchoolGroup> {
    try {
      const group = await groupService.createGroup(groupData);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${ALL_GROUPS_CACHE_KEY}`);
      
      return group;
    } catch (error) {
      console.error('[GroupService] Error in createGroup with cache:', error);
      throw error;
    }
  },

  // Update group with cache invalidation
  async updateGroup(groupId: string, groupData: any): Promise<ISchoolGroup | null> {
    try {
      const group = await groupService.updateGroup(groupId, groupData);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${ALL_GROUPS_CACHE_KEY}`);
      await invalidateCacheByPrefix(`${GROUP_STUDENTS_PREFIX}${groupId}`);
      
      return group;
    } catch (error) {
      console.error(`[GroupService] Error in updateGroup with cache for ID ${groupId}:`, error);
      throw error;
    }
  },

  // Add student to group with cache invalidation
  async addStudentToGroup(groupId: string, studentId: string): Promise<boolean | { success: false, error: string }> {
    try {
      const result = await groupService.addStudentToGroup(groupId, studentId);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_STUDENTS_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_ENROLLMENTS_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}available-students-${groupId}`);
      
      return result;
    } catch (error) {
      console.error(`[GroupService] Error in addStudentToGroup with cache for group ${groupId}:`, error);
      throw error;
    }
  },

  // Remove student from group with cache invalidation
  async removeStudentFromGroup(groupId: string, studentId: string): Promise<boolean | { success: false, error: string }> {
    try {
      const result = await groupService.removeStudentFromGroup(groupId, studentId);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_STUDENTS_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_ENROLLMENTS_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}available-students-${groupId}`);
      
      return result;
    } catch (error) {
      console.error(`[GroupService] Error in removeStudentFromGroup with cache for group ${groupId}:`, error);
      throw error;
    }
  },

  // Delete group with cache invalidation
  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const result = await groupService.deleteGroup(groupId);
      
      // Invalidate relevant cache entries
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_CACHE_PREFIX}${ALL_GROUPS_CACHE_KEY}`);
      await invalidateCacheByPrefix(`${GROUP_STUDENTS_PREFIX}${groupId}`);
      await invalidateCacheByPrefix(`${GROUP_ENROLLMENTS_PREFIX}${groupId}`);
      
      return result;
    } catch (error) {
      console.error(`[GroupService] Error in deleteGroup with cache for ID ${groupId}:`, error);
      throw error;
    }
  }
}; 