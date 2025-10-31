import createApiClient from '../apiClient';
import { Material } from '../../types';

/**
 * Pure API client for material operations.
 * Follows the Single Responsibility Principle by focusing only on API calls.
 * Follows the Dependency Inversion Principle by depending on abstractions.
 * No caching, no business logic - just raw API interactions.
 */
export class MaterialApiClient {
  private apiClient = createApiClient();

  /**
   * Get a material by ID
   */
  async getMaterialById(id: string): Promise<Material> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    const response = await this.apiClient.get(`/material/${id}`);
    return response.data;
  }

  /**
   * Get materials by course ID
   */
  async getMaterialsByCourseId(courseId: string): Promise<Material[]> {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await this.apiClient.get(`/material/course/${courseId}`);
    const data = response.data;

    // Ensure we return an array
    if (!Array.isArray(data)) {
      return data ? [data] : [];
    }

    return data;
  }

  /**
   * Get all materials
   */
  async getAllMaterials(): Promise<Material[]> {
    const response = await this.apiClient.get('/material/search', {
      params: { searchTerm: '' }
    });

    const data = response.data;

    // Ensure we return an array
    if (!Array.isArray(data)) {
      return data ? [data] : [];
    }

    return data;
  }

  /**
   * Search materials
   */
  async searchMaterials(searchTerm: string): Promise<Material[]> {
    const response = await this.apiClient.get('/material/search', {
      params: { searchTerm }
    });

    const data = response.data;

    // Ensure we return an array
    if (!Array.isArray(data)) {
      return data ? [data] : [];
    }

    return data;
  }

  /**
   * Create a material
   */
  async createMaterial(material: Partial<Material>): Promise<Material> {
    const response = await this.apiClient.post('/material', material);
    return response.data;
  }

  /**
   * Upload a material with file
   */
  async uploadMaterial(formData: FormData): Promise<Material> {
    const response = await this.apiClient.post('/material', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Bulk upload materials
   */
  async bulkUploadMaterials(formData: FormData): Promise<Material[]> {
    const response = await this.apiClient.post('/material/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Update a material
   */
  async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    const response = await this.apiClient.put(`/material/${id}`, material);
    return response.data;
  }

  /**
   * Delete a material
   */
  async deleteMaterial(id: string): Promise<void> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    await this.apiClient.delete(`/material/${id}`);
  }

  /**
   * Get material content URL
   */
  getMaterialContentUrl(id: string): string {
    return `/api/material/${id}/content`;
  }
}

// Export a singleton instance
export const materialApiClient = new MaterialApiClient();

