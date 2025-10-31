import localforage from 'localforage';
import axios, { AxiosRequestConfig } from 'axios';

// Configure localforage storage
export const configureStorage = () => {
  localforage.config({
    name: 'tehtavaappCache',
    storeName: 'fileCache',
    description: 'Cache for material and assignment files'
  });
};

// Initialize storage
configureStorage();

// Cache defaults
const CACHE_DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MATERIALS_TTL = 6 * 60 * 60 * 1000; // 6 hours for materials
const ASSIGNMENTS_TTL = 3 * 60 * 60 * 1000; // 3 hours for assignments
const PUBLIC_CONTENT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for public content

// Cache keys prefixes
const MATERIAL_PREFIX = 'material-';
const ASSIGNMENT_PREFIX = 'assignment-';
const COURSE_MATERIALS_PREFIX = 'course-materials-';
const ASSIGNMENT_FILES_PREFIX = 'assignment-files-';

interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

interface CachedItem {
  data: any;
  timestamp: number;
  ttl: number;
}

// Method to cache a value with TTL
export const cacheItem = async (key: string, data: any, ttl: number = CACHE_DEFAULT_TTL): Promise<void> => {
  const item: CachedItem = {
    data,
    timestamp: Date.now(),
    ttl
  };
  await localforage.setItem(key, item);
};

// Method to get cached value if it exists and is not expired
export const getCachedItem = async <T>(key: string, options: CacheOptions = {}): Promise<T | null> => {
  // If forcing refresh, skip the cache
  if (options.forceRefresh) {
    return null;
  }

  try {
    const cachedItem = await localforage.getItem<CachedItem>(key);
    
    if (!cachedItem) {
      return null;
    }

    const { data, timestamp, ttl } = cachedItem;
    const currentTime = Date.now();
    
    // Check if cache is expired
    if (currentTime - timestamp > ttl) {
      // Remove expired item
      await localforage.removeItem(key);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error('Error retrieving cached item:', error);
    return null;
  }
};

// Method to invalidate specific cache items
export const invalidateCache = async (key: string): Promise<void> => {
  await localforage.removeItem(key);
};

// Method to invalidate all cache for a specific type
export const invalidateCacheByPrefix = async (prefix: string): Promise<void> => {
  const keys = await localforage.keys();
  const keysToRemove = keys.filter(key => key.startsWith(prefix));
  
  await Promise.all(keysToRemove.map(key => localforage.removeItem(key)));
};

// Helper methods for common cache operations
export const cacheMaterialContent = async (materialId: string, content: Blob): Promise<void> => {
  await cacheItem(`${MATERIAL_PREFIX}content-${materialId}`, content, MATERIALS_TTL);
};

export const getCachedMaterialContent = async (materialId: string, options: CacheOptions = {}): Promise<Blob | null> => {
  return getCachedItem<Blob>(`${MATERIAL_PREFIX}content-${materialId}`, options);
};

export const cacheCourseMaterials = async (courseId: string, materials: any[]): Promise<void> => {
  await cacheItem(`${COURSE_MATERIALS_PREFIX}${courseId}`, materials, MATERIALS_TTL);
};

export const getCachedCourseMaterials = async (courseId: string, options: CacheOptions = {}): Promise<any[] | null> => {
  return getCachedItem<any[]>(`${COURSE_MATERIALS_PREFIX}${courseId}`, options);
};

export const cacheAssignmentFiles = async (assignmentId: string, files: any[]): Promise<void> => {
  await cacheItem(`${ASSIGNMENT_FILES_PREFIX}${assignmentId}`, files, ASSIGNMENTS_TTL);
};

export const getCachedAssignmentFiles = async (assignmentId: string, options: CacheOptions = {}): Promise<any[] | null> => {
  return getCachedItem<any[]>(`${ASSIGNMENT_FILES_PREFIX}${assignmentId}`, options);
};

export const cachePublicMaterialContent = async (materialId: string, content: Blob): Promise<void> => {
  await cacheItem(`${MATERIAL_PREFIX}public-content-${materialId}`, content, PUBLIC_CONTENT_TTL);
};

export const getCachedPublicMaterialContent = async (materialId: string, options: CacheOptions = {}): Promise<Blob | null> => {
  return getCachedItem<Blob>(`${MATERIAL_PREFIX}public-content-${materialId}`, options);
};

// Simple function to create an axios instance with custom caching based on our own implementation
export const createCachingAxiosInstance = (baseURL: string, defaultTTL: number = CACHE_DEFAULT_TTL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  // Add request interceptor for caching
  instance.interceptors.request.use(async (config) => {
    // Only cache GET requests
    if (config.method?.toLowerCase() !== 'get') {
      return config;
    }
    
    // Check if caching is enabled for this request
    if (config.params?._forceRefresh || config.params?._noCache) {
      // Remove special params before sending request
      if (config.params) {
        delete config.params._forceRefresh;
        delete config.params._noCache;
      }
      return config;
    }
    
    try {
      // Create cache key from URL and params
      const url = config.url || '';
      const params = config.params ? JSON.stringify(config.params) : '';
      const cacheKey = `http-cache-${url}-${params}`;
      
      // Try to get from cache
      const cachedResponse = await getCachedItem(cacheKey);
      
      if (cachedResponse) {
        // Return response from cache
        return {
          ...config,
          adapter: () => {
            return Promise.resolve({
              data: cachedResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
              request: {}
            });
          }
        };
      }
    } catch (error) {
      console.error('Error in cache interceptor:', error);
    }
    
    return config;
  });
  
  // Add response interceptor for caching
  instance.interceptors.response.use(async (response) => {
    // Only cache GET requests
    if (response.config.method?.toLowerCase() !== 'get') {
      return response;
    }
    
    // Don't cache if _noCache param was present
    if (response.config.params?._noCache) {
      return response;
    }
    
    try {
      // Create cache key from URL and params
      const url = response.config.url || '';
      const params = response.config.params ? JSON.stringify(response.config.params) : '';
      const cacheKey = `http-cache-${url}-${params}`;
      
      // Cache the response data
      await cacheItem(cacheKey, response.data, defaultTTL);
    } catch (error) {
      console.error('Error caching response:', error);
    }
    
    return response;
  });
  
  return instance;
};

// Clear all cache
export const clearAllCache = async (): Promise<void> => {
  await localforage.clear();
};

// Get cache stats
export const getCacheStats = async (): Promise<{ keys: string[], size: number }> => {
  const keys = await localforage.keys();
  let totalSize = 0;
  
  for (const key of keys) {
    const item = await localforage.getItem<CachedItem>(key);
    if (item && item.data) {
      // Rough estimation for JSON objects
      if (typeof item.data === 'object') {
        totalSize += JSON.stringify(item.data).length;
      } 
      // For Blobs, use their size property
      else if (item.data instanceof Blob) {
        totalSize += item.data.size;
      }
    }
  }
  
  return {
    keys,
    size: totalSize
  };
};

/**
 * Invalidates cache for a specific item by key
 * @param key - The cache key to invalidate
 */
export const invalidateCacheItem = async (key: string): Promise<void> => {
  try {
    await localforage.removeItem(key);
    console.log(`Cache invalidated for key: ${key}`);
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error);
  }
};

/**
 * Invalidates cache for a specific course's materials
 * @param courseId - The course ID to invalidate materials for
 */
export const invalidateCourseMaterialsCache = async (courseId: string): Promise<void> => {
  try {
    // Invalidate single course materials cache
    await invalidateCacheItem(`materials_course_${courseId}`);
    
    // Also invalidate the all materials cache since it contains the course materials
    await invalidateCacheItem('all_materials');
    
    // We also need to invalidate any combined course materials caches that might include this course
    // This is more complex and would require checking all cache keys or maintaining a registry of keys
    // For now, we'll log a warning
    console.log(`Invalidated cache for course ${courseId} materials. Note: combined course materials caches might need invalidation.`);
  } catch (error) {
    console.error(`Error invalidating materials cache for course ${courseId}:`, error);
  }
};

/**
 * Invalidates cache for a specific course's assignments
 * @param courseId - The course ID to invalidate assignments for
 */
export const invalidateCourseAssignmentsCache = async (courseId: string): Promise<void> => {
  try {
    // Invalidate single course assignments cache
    await invalidateCacheItem(`assignments_course_${courseId}`);
    
    // Also invalidate the all assignments cache since it contains the course assignments
    await invalidateCacheItem('all_assignments');
    
    // Similar warning for combined caches
    console.log(`Invalidated cache for course ${courseId} assignments. Note: combined course assignments caches might need invalidation.`);
  } catch (error) {
    console.error(`Error invalidating assignments cache for course ${courseId}:`, error);
  }
}; 