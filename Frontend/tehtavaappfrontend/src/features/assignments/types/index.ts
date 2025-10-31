export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  points?: number;
  status?: string;
  relatedMaterials?: any[];
  deadline?: string;
  contentMarkdown?: string;
} 