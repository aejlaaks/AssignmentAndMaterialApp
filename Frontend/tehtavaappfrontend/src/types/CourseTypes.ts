import { Block } from './blocks';
import { SchoolGroup } from '../interfaces/models/SchoolGroup';

/**
 * Unified Course interface with consistent property naming
 * This is the canonical representation of a Course in the frontend
 */
export interface Course {
  id: string;
  title: string;               // Standardized to 'title' instead of 'name'
  description: string;
  code?: string;
  teacherId?: string;
  teacherName?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  contentBlocks?: Block[];
  studentCount?: number;
  materialCount?: number;
  assignmentCount?: number;
  groups?: SchoolGroup[];
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;          // Standardized to 'isActive' instead of 'isPublic'
  tags?: string[];
}

/**
 * Interface for API requests to create or update a course
 * Maps to the properties needed by the backend
 */
export interface CourseRequest {
  name: string;                // Backend uses 'name' instead of 'title'
  description: string;
  code?: string;               // Frontend lowercase property
  Code?: string;               // Backend uppercase property (add this for proper serialization)
  contentBlocks?: Block[];
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  TeacherId?: string;         // Add TeacherId field to match backend requirements
}

/**
 * Interface for course enrollment
 */
export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  enrollmentDate: string | Date;
  status: string;
  completionDate?: string | Date;
  progress?: number;
}

/**
 * Type mapping utilities for converting between API and UI models
 */
export const courseMappers = {
  /**
   * Maps API response data to the frontend Course model
   */
  toUiModel: (apiData: any): Course => {
    return {
      id: apiData.id,
      title: apiData.name || apiData.title || '',
      description: apiData.description || '',
      code: apiData.code || apiData.Code || '', // Handle both capitalizations
      teacherId: apiData.teacherId || apiData.TeacherId, // Handle both capitalizations
      teacherName: apiData.teacherName,
      createdById: apiData.createdById || apiData.createdBy,
      createdByName: apiData.createdByName,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      contentBlocks: apiData.contentBlocks || [],
      studentCount: apiData.studentCount,
      materialCount: apiData.materialCount,
      assignmentCount: apiData.assignmentCount,
      groups: apiData.groups,
      startDate: apiData.startDate,
      endDate: apiData.endDate,
      isActive: apiData.isActive !== false, // Default to true if undefined
      tags: apiData.tags || []
    };
  },

  /**
   * Maps frontend Course model to the format expected by the API
   */
  toApiModel: (uiModel: Course): CourseRequest => {
    const code = uiModel.code || '';
    return {
      name: uiModel.title,
      description: uiModel.description,
      code: code, // Include lowercase version
      Code: code, // Also include uppercase version for backend
      contentBlocks: uiModel.contentBlocks,
      isActive: uiModel.isActive,
      startDate: uiModel.startDate ? new Date(uiModel.startDate).toISOString() : undefined,
      endDate: uiModel.endDate ? new Date(uiModel.endDate).toISOString() : undefined,
      TeacherId: uiModel.teacherId
    };
  }
}; 