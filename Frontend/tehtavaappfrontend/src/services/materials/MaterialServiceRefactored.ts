import { Material } from '../../types';
import { MaterialApiClient, materialApiClient } from './MaterialApiClient';
import { MaterialCacheService, materialCacheService } from './MaterialCacheService';

/**
 * Refactored Material Service following SOLID principles.
 * Orchestrates MaterialApiClient and MaterialCacheService.
 * Follows the Single Responsibility Principle - focuses on orchestration logic.
 * Follows the Dependency Inversion Principle - depends on abstractions.
 * Follows the Open/Closed Principle - can be extended without modification.
 */
export class MaterialServiceRefactored {
  private apiClient: MaterialApiClient;
  private cacheService: MaterialCacheService;

  constructor(
    apiClient: MaterialApiClient = materialApiClient,
    cacheService: MaterialCacheService = materialCacheService
  ) {
    this.apiClient = apiClient;
    this.cacheService = cacheService;
    console.log('MaterialServiceRefactored initialized');
  }

  /**
   * Get a material by ID
   * Uses cache-aside pattern
   */
  async getMaterialById(id: string, forceRefresh: boolean = false): Promise<Material> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = this.cacheService.getMaterial(id);
      if (cached) {
        console.log(`Using cached material: ${id}`);
        return cached;
      }
    }

    // Fetch from API
    console.log(`Fetching material from API: ${id}`);
    const material = await this.apiClient.getMaterialById(id);

    // Update cache
    this.cacheService.setMaterial(material);

    return material;
  }

  /**
   * Get materials by course ID
   * Uses cache-aside pattern
   */
  async getMaterialsByCourseId(
    courseId: string, 
    forceRefresh: boolean = false
  ): Promise<Material[]> {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = this.cacheService.getCourseMaterials(courseId);
      if (cached) {
        console.log(`Using cached materials for course: ${courseId} (${cached.length} items)`);
        return cached;
      }
    } else {
      console.log(`Forcing refresh for course materials: ${courseId}`);
      this.cacheService.invalidateCourseMaterials(courseId);
    }

    // Fetch from API
    console.log(`Fetching materials from API for course: ${courseId}`);
    const materials = await this.apiClient.getMaterialsByCourseId(courseId);

    // Update cache
    this.cacheService.setCourseMaterials(courseId, materials);

    // Also cache individual materials
    materials.forEach(material => {
      this.cacheService.setMaterial(material);
    });

    return materials;
  }

  /**
   * Get all materials
   * Uses cache-aside pattern
   */
  async getAllMaterials(forceRefresh: boolean = false): Promise<Material[]> {
    // Check cache first unless forcing refresh
    if (!forceRefresh) {
      const cached = this.cacheService.getAllMaterials();
      if (cached) {
        console.log(`Using cached all materials (${cached.length} items)`);
        return cached;
      }
    } else {
      console.log('Forcing refresh for all materials');
      this.cacheService.invalidateAllMaterials();
    }

    // Fetch from API
    console.log('Fetching all materials from API');
    const materials = await this.apiClient.getAllMaterials();

    // Update cache
    this.cacheService.setAllMaterials(materials);

    // Also cache individual materials
    materials.forEach(material => {
      this.cacheService.setMaterial(material);
    });

    return materials;
  }

  /**
   * Search materials
   * Does not use cache (search results can vary)
   */
  async searchMaterials(searchTerm: string): Promise<Material[]> {
    console.log(`Searching materials: ${searchTerm}`);
    return await this.apiClient.searchMaterials(searchTerm);
  }

  /**
   * Create a material
   * Invalidates relevant caches
   */
  async createMaterial(material: Partial<Material>): Promise<Material> {
    console.log('Creating material:', material.title);
    const created = await this.apiClient.createMaterial(material);

    // Invalidate relevant caches
    this.cacheService.invalidateAllMaterials();
    if (created.courseId) {
      this.cacheService.invalidateCourseMaterials(created.courseId);
    }

    // Cache the new material
    this.cacheService.setMaterial(created);

    return created;
  }

  /**
   * Upload a material with file
   * Invalidates relevant caches
   */
  async uploadMaterial(formData: FormData): Promise<Material> {
    console.log('Uploading material with file');
    const uploaded = await this.apiClient.uploadMaterial(formData);

    // Invalidate relevant caches
    this.cacheService.invalidateAllMaterials();
    if (uploaded.courseId) {
      this.cacheService.invalidateCourseMaterials(uploaded.courseId);
    }

    // Cache the new material
    this.cacheService.setMaterial(uploaded);

    return uploaded;
  }

  /**
   * Bulk upload materials
   * Invalidates relevant caches
   */
  async bulkUploadMaterials(formData: FormData): Promise<Material[]> {
    console.log('Bulk uploading materials');
    const uploaded = await this.apiClient.bulkUploadMaterials(formData);

    // Invalidate all caches
    this.cacheService.clearAll();

    // Cache individual materials
    uploaded.forEach(material => {
      this.cacheService.setMaterial(material);
    });

    return uploaded;
  }

  /**
   * Update a material
   * Updates all relevant caches
   */
  async updateMaterial(id: string, material: Partial<Material>): Promise<Material> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    console.log(`Updating material: ${id}`);
    const updated = await this.apiClient.updateMaterial(id, material);

    // Update material in all caches
    this.cacheService.updateMaterialInCaches(updated);

    return updated;
  }

  /**
   * Delete a material
   * Removes from all caches
   */
  async deleteMaterial(id: string, courseId?: string): Promise<void> {
    if (!id) {
      throw new Error('Material ID is required');
    }

    console.log(`Deleting material: ${id}`);
    await this.apiClient.deleteMaterial(id);

    // Remove from all caches
    this.cacheService.removeMaterialFromCaches(id, courseId);
  }

  /**
   * Get material content URL
   */
  getMaterialContentUrl(id: string): string {
    return this.apiClient.getMaterialContentUrl(id);
  }

  /**
   * Clear all caches manually
   */
  clearCaches(): void {
    console.log('Clearing all material caches');
    this.cacheService.clearAll();
  }

  /**
   * Refresh materials for a course (force refresh)
   */
  async refreshCourseMaterials(courseId: string): Promise<Material[]> {
    console.log(`Refreshing materials for course: ${courseId}`);
    return await this.getMaterialsByCourseId(courseId, true);
  }
}

// Export a singleton instance
export const materialServiceRefactored = new MaterialServiceRefactored();

