import createApiClient from '../apiClient';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';
import { Material } from '../../types/Material';
import {
  cachePublicMaterialContent,
  getCachedPublicMaterialContent,
  invalidateCacheByPrefix,
  getCachedItem,
  cacheItem,
  invalidateCache
} from '../../utils/cacheUtils';

// Constants
const COURSE_MATERIALS_PREFIX = 'course-materials-';

// Create API client instance 
const axiosInstance = createApiClient();

export class MaterialService {
  constructor() {
    console.log('MaterialService initialized');
  }

  /**
   * Helper method to add auth headers to requests
   */
  private addAuthHeaders(config: any) {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }

  /**
   * Gets a material by ID
   */
  async getMaterialById(id: string): Promise<Material> {
    if (!id) {
      console.error("Material ID is required");
      throw new Error("Material ID is required");
    }
    
    try {
      const response = await axiosInstance.get(`/material/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets materials, optionally filtered by course
   */
  async getMaterials(courseId?: string, forceRefresh = false): Promise<Material[]> {
    // Logic for handling course materials fetch
    if (courseId) {
      // Before making a real API call, check if we have the data cached
      const cacheKey = `${COURSE_MATERIALS_PREFIX}${courseId}`;
      
      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cachedMaterials = localStorage.getItem(cacheKey);
        if (cachedMaterials) {
          try {
            const parsedMaterials = JSON.parse(cachedMaterials);
            console.log(`[MATERIAL SERVICE] Using cached materials for course ${courseId}`, parsedMaterials);
            return parsedMaterials;
          } catch (error) {
            console.error("Error parsing cached materials:", error);
            localStorage.removeItem(cacheKey);
          }
        }
      } else {
        // If forcing refresh, clear the cache for this course
        console.log(`[MATERIAL SERVICE] Forcing refresh for course ${courseId}, clearing cache`);
        localStorage.removeItem(cacheKey);
      }
      
      try {
        // User agent for debugging - identify if teacher or student
        const userRole = authService.getCurrentUser()?.role || 'unknown';
        console.log(`[MATERIAL SERVICE] User role: ${userRole} - Sending request to /material/course/${courseId}`);
        
        // Make the API call using the fully qualified path
        const response = await axiosInstance.get(`/material/course/${courseId}`);
        console.log(`[MATERIAL SERVICE] Response received for course ${courseId} - Status: ${response.status}`);
        
        if (response.data) {
          let materials = response.data;
          
          // Ensure materials is an array
          if (!Array.isArray(materials)) {
            console.warn('[MATERIAL SERVICE] API returned non-array for materials, converting to array');
            materials = Array.isArray(materials) ? materials : (materials ? [materials] : []);
          }
          
          // Cache the course materials
          localStorage.setItem(cacheKey, JSON.stringify(materials));
          console.log(`[MATERIAL SERVICE] Cached ${materials.length} materials for course ${courseId} (user: ${userRole})`);
          
          return materials;
        }
        
        return [];
      } catch (error) {
        console.error(`Error fetching materials for course ${courseId}:`, error);
        return [];
      }
    }
    
    // Return all materials if no courseId is provided
    try {
      console.log('[MATERIAL SERVICE] Fetching all materials using search endpoint');
      
      // Use the search endpoint with empty search term to get all materials
      const response = await axiosInstance.get('/material/search', {
        params: {
          searchTerm: '',  // Empty search term returns all materials
          timestamp: new Date().getTime() // Add a cache buster
        }
      });
      
      // Log response information
      console.log(`[MATERIAL SERVICE] All materials response status: ${response.status}`);
      
      // Ensure we always return an array
      const materials = response.data || [];
      if (!Array.isArray(materials)) {
        console.warn('[MATERIAL SERVICE] API returned non-array for all materials, converting to array');
        return Array.isArray(materials) ? materials : (materials ? [materials] : []);
      }
      
      console.log(`[MATERIAL SERVICE] Retrieved ${materials.length} materials from API`);
      return materials;
    } catch (error) {
      console.error("Error fetching all materials:", error);
      return [];
    }
  }

  /**
   * Searches for materials by search term
   */
  async searchMaterials(searchTerm: string = ''): Promise<Material[]> {
    try {
      const response = await axiosInstance.get(`/material/search?term=${encodeURIComponent(searchTerm)}`);
      const data = response.data;
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.warn('Material search API returned non-array, converting');
        return data ? [data] : [];
      }
      
      return data;
    } catch (error) {
      console.error("Error searching materials:", error);
      throw error;
    }
  }

  /**
   * Adds a material to a course
   */
  async addMaterialToCourse(materialId: string, courseId: string): Promise<boolean> {
    if (!materialId || !courseId) {
      console.error("Material ID and Course ID are required");
      return false;
    }
    
    try {
      await axiosInstance.post(`/material/${materialId}/course/${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error adding material ${materialId} to course ${courseId}:`, error);
      return false;
    }
  }

  /**
   * Gets material content by ID
   */
  async getMaterialContent(id: string, forceRefresh = false): Promise<Blob> {
    if (!id) {
      throw new Error("Material ID is required");
    }
    
    try {
      // If cache missed or forcing refresh, fetch from API
      console.log(`Cache miss or refresh forced, fetching from API for material ${id}`);
      const response = await axiosInstance.get(`/material/${id}/content`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching material content for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets public material content by ID
   */
  async getPublicMaterialContent(id: string, forceRefresh = false): Promise<Blob> {
    if (!id) {
      throw new Error("Material ID is required");
    }
    
    try {
      // Check if we have cached data and if we should use it
      if (!forceRefresh) {
        const cachedContent = await getCachedPublicMaterialContent(id);
        if (cachedContent) {
          console.log(`Using cached content for public material ${id}`);
          return cachedContent;
        }
      }
      
      // If cache missed, fetch from API
      console.log(`Fetching public content for material ${id}`);
      const response = await axiosInstance.get(`${API_URL}/public/material/${id}/content`, {
        responseType: 'blob'
      });
      
      // Cache the result
      await cachePublicMaterialContent(id, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching public material content for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new material
   */
  async createMaterial(material: Omit<Material, 'id' | 'createdAt'>): Promise<Material> {
    try {
      if (!material.title) {
        throw new Error("Material title is required");
      }
      
      const materialData = {
        ...material,
        // Force status if not set
        status: (material as any).status || 'Valmis'
      };
      
      console.log('Creating material with data:', materialData);
      
      // Make sure we're using the /material/json endpoint for consistent behavior with assignments
      const response = await axiosInstance.post<Material>(`/material/json`, materialData);
      
      console.log('Material creation response:', response.status, response.statusText);
      
      // Invalidate relevant caches
      if (material.courseId) {
        invalidateCacheByPrefix(COURSE_MATERIALS_PREFIX);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  }

  /**
   * Creates a new material with form data
   */
  async createMaterialWithFormData(formData: FormData): Promise<Material> {
    try {
      const response = await axiosInstance.post<Material>('/material', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Invalidate caches
      invalidateCacheByPrefix(COURSE_MATERIALS_PREFIX);
      
      return response.data;
    } catch (error) {
      console.error("Error creating material with form data:", error);
      throw error;
    }
  }

  /**
   * Deletes a material
   */
  async deleteMaterial(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error("Material ID is required for deletion");
      }
      
      await axiosInstance.delete(`/material/${id}`);
      
      // Invalidate caches
      invalidateCacheByPrefix(COURSE_MATERIALS_PREFIX);
      
      return true;
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      return false;
    }
  }

  /**
   * Updates a material
   */
  async updateMaterial(id: string, updatedMaterial: Partial<Material>): Promise<Material> {
    try {
      if (!id) {
        throw new Error("Material ID is required for update");
      }
      
      const response = await axiosInstance.put<Material>(`/material/${id}`, updatedMaterial);
      
      // Invalidate caches
      invalidateCacheByPrefix(COURSE_MATERIALS_PREFIX);
      
      return response.data;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      throw error;
    }
  }

  /**
   * Downloads a material
   */
  async downloadMaterial(id: string, title?: string): Promise<void> {
    try {
      const response = await axiosInstance.get(`/material/${id}/download`, {
        responseType: 'blob'
      });
      
      let fileName = null;
      
      // Try to get the filename from the Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      // If no filename was found in the header, use the provided title or a default name
      if (!fileName) {
        // Use provided title or fallback to default name with material ID
        fileName = title ? `${title}.pdf` : `material-${id}.pdf`;
      }
      
      // Create a URL for the blob
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Append the link to the body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      // Revoke the URL to free up memory
      window.URL.revokeObjectURL(url);
      
      // Return void as we're not actually returning any data to the caller
      return;
    } catch (error) {
      console.error(`Error downloading material ${id}:`, error);
      throw error;
    }
  }

  /**
   * Gets all materials
   */
  async getAllMaterials(forceRefresh = false): Promise<Material[]> {
    try {
      // Check if we have cached data and if we should use it
      const cacheKey = 'all_materials';
      if (!forceRefresh) {
        const cachedMaterials = await getCachedItem<Material[]>(cacheKey);
        if (cachedMaterials) {
          console.log(`Using cached all materials - count: ${cachedMaterials.length}`);
          return cachedMaterials;
        }
      }
      
      // If cache missed or forcing refresh, fetch from API
      console.log('Fetching all materials from API using search endpoint with empty term');
      // Use the search endpoint with empty search term instead of /material
      const response = await axiosInstance.get('/material/search', {
        params: {
          searchTerm: '',
          timestamp: new Date().getTime() // Add a cache buster if forceRefresh is true
        }
      });
      
      // Process the data to ensure it's an array
      const materials = response.data;
      console.log(`getAllMaterials API returned data of type: ${typeof materials}`);
      console.log(`Is array: ${Array.isArray(materials)}`);
      
      // Ensure we're working with an array
      let materialsArray: Material[];
      if (Array.isArray(materials)) {
        materialsArray = materials;
      } else if (materials && typeof materials === 'object') {
        // If it's a single object, wrap it in an array
        materialsArray = [materials];
        console.warn('getAllMaterials API returned a single object instead of an array, converting');
      } else {
        // If it's null, undefined or something else, use an empty array
        materialsArray = [];
        console.warn('getAllMaterials API returned invalid data, using empty array');
      }
      
      // Cache the cleaned result
      await cacheItem(cacheKey, materialsArray);
      console.log(`Cached ${materialsArray.length} materials`);
      
      return materialsArray;
    } catch (error) {
      console.error('Error in getAllMaterials:', error);
      return [];
    }
  }

  /**
   * Gets materials for a specific course
   */
  async getMaterialsByCourse(courseId: string, forceRefresh = false): Promise<Material[]> {
    try {
      if (!courseId) {
        console.warn('No courseId provided to getMaterialsByCourse');
        return [];
      }
      
      // Check if we have cached data and if we should use it
      const cacheKey = `materials_course_${courseId}`;
      if (!forceRefresh) {
        const cachedMaterials = await getCachedItem<Material[]>(cacheKey);
        if (cachedMaterials) {
          console.log(`Using cached materials for course ${courseId} - count: ${cachedMaterials.length}`);
          return cachedMaterials;
        }
      }
      
      // If cache missed or forcing refresh, fetch from API
      console.log(`Fetching materials for course ${courseId} from API`);
      const response = await axiosInstance.get(`/material/course/${courseId}`);
      
      // Process the data to ensure it's an array
      const materials = response.data;
      
      // Ensure we're working with an array
      let materialsArray: Material[];
      if (Array.isArray(materials)) {
        materialsArray = materials;
      } else if (materials && typeof materials === 'object') {
        // If it's a single object, wrap it in an array
        materialsArray = [materials];
        console.warn(`Materials API for course ${courseId} returned a single object instead of an array, converting`);
      } else {
        // If it's null, undefined or something else, use an empty array
        materialsArray = [];
        console.warn(`Materials API for course ${courseId} returned invalid data, using empty array`);
      }
      
      // Cache the cleaned result
      await cacheItem(cacheKey, materialsArray);
      console.log(`Cached ${materialsArray.length} materials for course ${courseId}`);
      
      return materialsArray;
    } catch (error) {
      console.error(`Error in getMaterialsByCourse for courseId ${courseId}:`, error);
      return [];
    }
  }

  /**
   * Gets materials for multiple courses
   */
  async getMaterialsForCourses(courseIds: string[], forceRefresh = false): Promise<Material[]> {
    try {
      if (!courseIds || courseIds.length === 0) {
        console.log('No course IDs provided to getMaterialsForCourses, returning empty array');
        return [];
      }
      
      console.log(`Getting materials for ${courseIds.length} courses`);
      
      // Try to get all materials first (often more efficient)
      const allMaterials = await this.getAllMaterials(forceRefresh);
      console.log(`Loaded ${allMaterials.length} total materials, will filter by courses`);
      
      // If we have all materials, just filter by course IDs
      if (Array.isArray(allMaterials) && allMaterials.length > 0) {
        const filteredMaterials = allMaterials.filter(
          material => material.courseId && courseIds.includes(material.courseId)
        );
        console.log(`Filtered to ${filteredMaterials.length} materials for the ${courseIds.length} requested courses`);
        return filteredMaterials;
      }
      
      // Fallback: Fetch materials for each course individually
      console.log('Falling back to individual course material fetches');
      const materialsPromises = courseIds.map(courseId => 
        this.getMaterialsByCourse(courseId, forceRefresh)
      );
      
      const coursesResults = await Promise.all(materialsPromises);
      const combinedMaterials = coursesResults.flat();
      
      console.log(`Got ${combinedMaterials.length} materials from individual course fetches`);
      return combinedMaterials;
    } catch (error) {
      console.error('Error in getMaterialsForCourses:', error);
      return [];
    }
  }

  // Add utility type checking functions to the MaterialService class
  isPDF(material: Material): boolean {
    if (!material) return false;
    
    // Check file extension if fileType or fileName is available
    if (material.fileType) {
      return material.fileType.toLowerCase() === 'pdf' || 
             material.fileType.toLowerCase().includes('pdf');
    }
    
    if (material.fileName) {
      return material.fileName.toLowerCase().endsWith('.pdf');
    }
    
    // Alternatively check file URL
    if (material.fileUrl) {
      return material.fileUrl.toLowerCase().endsWith('.pdf');
    }
    
    return false;
  }

  isImage(material: Material): boolean {
    if (!material) return false;
    
    // Common image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    
    // Check fileType if available
    if (material.fileType) {
      const fileTypeLower = material.fileType.toLowerCase();
      return fileTypeLower.includes('image') || 
             imageExtensions.some(ext => fileTypeLower.includes(ext.substring(1)));
    }
    
    // Check fileName if available
    if (material.fileName) {
      const fileNameLower = material.fileName.toLowerCase();
      return imageExtensions.some(ext => fileNameLower.endsWith(ext));
    }
    
    // Check fileUrl as last resort
    if (material.fileUrl) {
      const fileUrlLower = material.fileUrl.toLowerCase();
      return imageExtensions.some(ext => fileUrlLower.endsWith(ext));
    }
    
    return false;
  }
}

// Create an instance of the service for export
export const materialService = new MaterialService();
