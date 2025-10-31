import axios from 'axios';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { IMaterialService } from '../../interfaces/services/IMaterialService';
import { Material } from '../../interfaces/models/Material';
import { formatApiError, throwApiError } from '../../utils/apiErrorHandler';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Concrete implementation of the IMaterialService interface
 * Following Single Responsibility Principle by handling only material-related operations
 */
export class MaterialServiceImpl implements IMaterialService {
  
  async getMaterialById(id: string): Promise<Material> {
    if (!id) {
      throw new Error('Cannot fetch material: ID is undefined or empty');
    }
    
    try {
      const response = await api.get(`/material/${id}`);
      return response.data;
    } catch (error) {
      // Use our new error handling utility
      throwApiError(error, `Error fetching material ${id}`);
    }
  }

  async getMaterials(courseId?: string): Promise<Material[]> {
    try {
      // If no courseId is provided, use the search endpoint which returns all materials
      if (!courseId) {
        console.log('No courseId provided, using search endpoint to get all materials');
        return await this.getAllMaterials();
      }
      
      // If courseId is provided, use the course-specific endpoint
      console.log(`Fetching materials for course ${courseId} (type: ${typeof courseId})`);
      const response = await api.get(`/material/course/${courseId}`);
      console.log(`Course materials response:`, response.status, response.statusText);
      console.log(`Course materials data:`, response.data);
      
      const data = response.data;
      
      if (data && data.$values) {
        return data.$values.filter((item: any) => 
          item && typeof item === 'object' && !item.$ref && item.id
        );
      }
      
      // If there's no $values property, assume it's a direct array
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      // Format the error but don't throw - return empty array instead
      const formattedError = formatApiError(error, 'Error fetching materials');
      console.error('Error details:', formattedError);
      return [];
    }
  }

  async searchMaterials(searchTerm: string = ''): Promise<Material[]> {
    try {
      const response = await api.get(`/material/search?term=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching materials:', error);
      throw error;
    }
  }

  async addMaterialToCourse(materialId: string, courseId: string): Promise<boolean> {
    try {
      const response = await api.post(`/material/${materialId}/course/${courseId}`);
      return response.status === 200;
    } catch (error) {
      console.error(`Error adding material ${materialId} to course ${courseId}:`, error);
      throw error;
    }
  }

  async createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
    try {
      const response = await api.post('/material', material);
      
      // Validate response data
      if (!response.data) {
        throwApiError(new Error('No data received in response'), 'Failed to create material');
      }
      
      return response.data;
    } catch (error) {
      // Use our new error handling utility with a specific error message
      throwApiError(error, 'Failed to create material. Please check your input and try again.');
    }
  }

  async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
    try {
      const response = await api.put(`/material/${id}`, material);
      return response.data;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    try {
      await api.delete(`/material/${id}`);
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      throw error;
    }
  }

  async downloadMaterial(id: string, filename?: string): Promise<void> {
    try {
      const response = await api.get(`/material/${id}/download`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from header if not provided
      let downloadFilename = filename;
      if (!downloadFilename) {
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch.length === 2) {
            downloadFilename = filenameMatch[1];
          }
        }
      }
      
      // Default filename if not found or provided
      link.setAttribute('download', downloadFilename || `material-${id}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading material ${id}:`, error);
      throw error;
    }
  }

  isPDF(material: Material): boolean {
    const hasPdfFileType = material.fileType === 'application/pdf';
    const hasPdfContentType = material.contentType === 'application/pdf';
    const hasPdfExtension = Boolean(material.fileUrl && material.fileUrl.toLowerCase().endsWith('.pdf'));
    
    return hasPdfFileType || hasPdfContentType || hasPdfExtension;
  }

  isDocument(material: Material): boolean {
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    return documentTypes.includes(material.fileType || '') || 
           documentTypes.includes(material.contentType || '') ||
           this.hasDocumentExtension(material.fileUrl || '');
  }
  
  private hasDocumentExtension(fileUrl: string): boolean {
    const docExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    const lowerUrl = fileUrl.toLowerCase();
    return docExtensions.some(ext => lowerUrl.endsWith(ext));
  }

  isImage(material: Material): boolean {
    return (material.fileType && material.fileType.startsWith('image/')) || 
           (material.contentType && material.contentType.startsWith('image/')) ||
           this.hasImageExtension(material.fileUrl || '');
  }
  
  private hasImageExtension(fileUrl: string): boolean {
    const imgExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const lowerUrl = fileUrl.toLowerCase();
    return imgExtensions.some(ext => lowerUrl.endsWith(ext));
  }

  getFileIcon(material: Material): string {
    if (this.isPDF(material)) {
      return 'description';
    } else if (this.isDocument(material)) {
      return 'assignment';
    } else if (this.isImage(material)) {
      return 'image';
    } else {
      return 'insert_drive_file';
    }
  }
  
  /**
   * Get all materials for bulk operations
   * @returns All materials
   */
  public getAllMaterials(): Promise<Material[]> {
    return this.getMaterials();
  }

  /**
   * Upload a material file
   * @param file File to upload
   * @param materialData Additional material data
   * @returns The created material
   */
  async uploadMaterial(file: File, materialData: any): Promise<Material> {
    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      formData.append('file', file);
      
      // Add all materialData properties to the formData
      Object.keys(materialData).forEach(key => {
        formData.append(key, materialData[key]);
      });
      
      const response = await axios.post(
        `${API_URL}/material/upload`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authService.getToken()}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading material:', error);
      throw error;
    }
  }

  /**
   * Update a material with file
   * @param materialId Material ID to update
   * @param fileData File data
   * @returns The updated material
   */
  async updateMaterialWithFile(materialId: string, fileData: { fileUrl: string; fileType?: string; courseId?: string }): Promise<Material> {
    try {
      const response = await api.put(`/material/${materialId}/file`, fileData);
      return response.data;
    } catch (error) {
      console.error('Error updating material with file:', error);
      throw error;
    }
  }
} 