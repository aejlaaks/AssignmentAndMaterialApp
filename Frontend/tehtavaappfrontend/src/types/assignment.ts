/**
 * Assignment entity interface
 */
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  points?: number;
  courseId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
} 