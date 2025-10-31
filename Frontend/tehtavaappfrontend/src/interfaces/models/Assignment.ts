/**
 * Enhanced Assignment interface with all required properties
 * This contains a superset of all assignment properties used in the application
 */
export interface Assignment {
  id: string;
  title: string;
  description: string;
  contentMarkdown?: string;
  courseId: string;
  dueDate: string;
  points?: number;
  status?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  relatedMaterials?: any[];
  submissionCount?: number;
} 