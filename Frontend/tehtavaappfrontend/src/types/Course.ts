/**
 * Course entity interface
 */
export interface Course {
  id: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  isPublic?: boolean;
} 