import { IStorageService, StorageItem } from './IStorageService';

/**
 * In-memory cache implementation of IStorageService.
 * Follows the Single Responsibility Principle by focusing only on in-memory caching.
 * Follows the Open/Closed Principle by implementing the IStorageService interface.
 * Data is stored in memory and cleared when the page is refreshed.
 * Useful for temporary caching and testing.
 */
export class InMemoryCacheService implements IStorageService {
  private cache: Map<string, StorageItem<any>>;

  constructor() {
    this.cache = new Map();
  }

  getItem<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }

      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error(`Error retrieving item from cache: ${key}`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T, expiryInMs?: number): void {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiryInMs ? Date.now() + expiryInMs : undefined
      };

      this.cache.set(key, item);
    } catch (error) {
      console.error(`Error setting item in cache: ${key}`, error);
    }
  }

  removeItem(key: string): void {
    try {
      this.cache.delete(key);
    } catch (error) {
      console.error(`Error removing item from cache: ${key}`, error);
    }
  }

  clear(): void {
    try {
      this.cache.clear();
    } catch (error) {
      console.error('Error clearing cache', error);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get the current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired items from the cache
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a default instance
export const inMemoryCacheService = new InMemoryCacheService();

// Auto-cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    inMemoryCacheService.cleanExpired();
  }, 5 * 60 * 1000);
}

