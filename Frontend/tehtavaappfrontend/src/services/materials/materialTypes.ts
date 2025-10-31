// Material interfaces for the application
export interface Material {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: string;
  fileUrl?: string;
  fileType?: string;
  contentType?: string;
  filePath?: string;
  courseId?: string;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  accessCount?: number;
}

// IMaterial with different date handling
export interface IMaterial {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: string;
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

export interface IMaterialCreateRequest {
  title: string;
  description: string;
  type?: string;
  courseId?: string;
  content?: string;
} 