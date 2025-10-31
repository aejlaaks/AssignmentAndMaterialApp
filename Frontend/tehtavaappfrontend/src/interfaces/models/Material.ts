/**
 * Enhanced Material interface with all required properties
 * This contains a superset of all material properties used in the application
 */
export interface Material {
  id: string;
  title: string;
  description: string;
  content?: string;
  type?: string;
  fileUrl?: string;
  fileType?: string;
  contentType?: string;
  filePath?: string;
  courseId?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  accessCount?: number;
} 