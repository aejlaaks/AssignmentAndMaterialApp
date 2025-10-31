import { Material } from '../../types';
import { IStorageService } from '../storage/IStorageService';
import { localStorageService } from '../storage/LocalStorageService';

/**
 * Cache service for materials.
 * Follows the Single Responsibility Principle by focusing only on caching logic.
 * Follows the Dependency Inversion Principle by depending on IStorageService abstraction.
 */
export class MaterialCacheService {
  private readonly storageService: IStorageService;
  private readonly cachePrefix: string = 'materials_';
  private readonly courseMaterialsPrefix: string = 'course_materials_';
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(storageService: IStorageService = localStorageService) {
    this.storageService = storageService;
  }

  /**
   * Get cached materials for a course
   */
  getCourseMaterials(courseId: string): Material[] | null {
    const key = `${this.courseMaterialsPrefix}${courseId}`;
    return this.storageService.getItem<Material[]>(key);
  }

  /**
   * Cache materials for a course
   */
  setCourseMaterials(courseId: string, materials: Material[], ttl?: number): void {
    const key = `${this.courseMaterialsPrefix}${courseId}`;
    this.storageService.setItem(key, materials, ttl || this.defaultTTL);
  }

  /**
   * Get cached material by ID
   */
  getMaterial(materialId: string): Material | null {
    const key = `${this.cachePrefix}${materialId}`;
    return this.storageService.getItem<Material>(key);
  }

  /**
   * Cache a single material
   */
  setMaterial(material: Material, ttl?: number): void {
    const key = `${this.cachePrefix}${material.id}`;
    this.storageService.setItem(key, material, ttl || this.defaultTTL);
  }

  /**
   * Get all cached materials
   */
  getAllMaterials(): Material[] | null {
    const key = `${this.cachePrefix}all`;
    return this.storageService.getItem<Material[]>(key);
  }

  /**
   * Cache all materials
   */
  setAllMaterials(materials: Material[], ttl?: number): void {
    const key = `${this.cachePrefix}all`;
    this.storageService.setItem(key, materials, ttl || this.defaultTTL);
  }

  /**
   * Invalidate cache for a specific course
   */
  invalidateCourseMaterials(courseId: string): void {
    const key = `${this.courseMaterialsPrefix}${courseId}`;
    this.storageService.removeItem(key);
  }

  /**
   * Invalidate cache for a specific material
   */
  invalidateMaterial(materialId: string): void {
    const key = `${this.cachePrefix}${materialId}`;
    this.storageService.removeItem(key);
  }

  /**
   * Invalidate all materials cache
   */
  invalidateAllMaterials(): void {
    const key = `${this.cachePrefix}all`;
    this.storageService.removeItem(key);
  }

  /**
   * Clear all material caches
   */
  clearAll(): void {
    const keys = this.storageService.keys();
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix) || key.startsWith(this.courseMaterialsPrefix)) {
        this.storageService.removeItem(key);
      }
    });
  }

  /**
   * Update a material in all relevant caches
   */
  updateMaterialInCaches(material: Material): void {
    // Update individual material cache
    this.setMaterial(material);

    // Update course materials cache if the material belongs to a course
    if (material.courseId) {
      const courseMaterials = this.getCourseMaterials(material.courseId);
      if (courseMaterials) {
        const updatedMaterials = courseMaterials.map(m => 
          m.id === material.id ? material : m
        );
        this.setCourseMaterials(material.courseId, updatedMaterials);
      }
    }

    // Update all materials cache
    const allMaterials = this.getAllMaterials();
    if (allMaterials) {
      const updatedMaterials = allMaterials.map(m => 
        m.id === material.id ? material : m
      );
      this.setAllMaterials(updatedMaterials);
    }
  }

  /**
   * Remove a material from all relevant caches
   */
  removeMaterialFromCaches(materialId: string, courseId?: string): void {
    // Remove individual material cache
    this.invalidateMaterial(materialId);

    // Remove from course materials cache
    if (courseId) {
      const courseMaterials = this.getCourseMaterials(courseId);
      if (courseMaterials) {
        const updatedMaterials = courseMaterials.filter(m => m.id !== materialId);
        this.setCourseMaterials(courseId, updatedMaterials);
      }
    }

    // Remove from all materials cache
    const allMaterials = this.getAllMaterials();
    if (allMaterials) {
      const updatedMaterials = allMaterials.filter(m => m.id !== materialId);
      this.setAllMaterials(updatedMaterials);
    }
  }
}

// Export a singleton instance
export const materialCacheService = new MaterialCacheService();

