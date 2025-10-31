import { Material } from '../models/Material';

export interface UploadMaterialRequest {
  file: File;
  name: string;
  description?: string;
  courseId: string;
}

export interface UpdateMaterialRequest {
  name?: string;
  description?: string;
}

/**
 * Interface for Material Service operations
 * Following Dependency Inversion Principle, high-level modules like components 
 * should depend on this abstraction instead of concrete implementations
 */
export interface IMaterialService {
  /**
   * Get a specific material by ID
   */
  getMaterialById(id: string): Promise<Material>;
  
  /**
   * Get all materials, optionally filtered by courseId
   */
  getMaterials(courseId?: string): Promise<Material[]>;
  
  /**
   * Search for materials using a search term
   */
  searchMaterials(searchTerm?: string): Promise<Material[]>;
  
  /**
   * Upload a material file
   */
  uploadMaterial(file: File, materialData: any): Promise<Material>;
  
  /**
   * Create a new material
   */
  createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<Material>;
  
  /**
   * Update material data
   */
  updateMaterial(id: string, material: Partial<Material>): Promise<Material>;
  
  /**
   * Delete a material
   */
  deleteMaterial(id: string): Promise<void>;
  
  /**
   * Download a material
   */
  downloadMaterial(id: string, filename?: string): Promise<void>;
  
  /**
   * Get all materials for bulk operations
   */
  getAllMaterials(): Promise<Material[]>;
  
  /**
   * Add a material to a course
   */
  addMaterialToCourse(materialId: string, courseId: string): Promise<boolean>;
  
  /**
   * Check if a material is a PDF
   */
  isPDF(material: Material): boolean;
  
  /**
   * Check if a material is a document
   */
  isDocument(material: Material): boolean;
  
  /**
   * Check if a material is an image
   */
  isImage(material: Material): boolean;
  
  /**
   * Get file icon for a material
   */
  getFileIcon(material: Material): string;
  
  /**
   * Update a material with file
   */
  updateMaterialWithFile(materialId: string, fileData: { fileUrl: string; fileType?: string; courseId?: string; }): Promise<Material>;
} 