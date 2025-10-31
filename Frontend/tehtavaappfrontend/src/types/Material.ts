/**
 * Material entity interface
 */
export interface Material {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  courseId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
} 