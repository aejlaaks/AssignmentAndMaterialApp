import { IStorageService, StorageItem } from './IStorageService';

/**
 * LocalStorage implementation of IStorageService.
 * Follows the Single Responsibility Principle by focusing only on localStorage operations.
 * Follows the Open/Closed Principle by implementing the IStorageService interface.
 */
export class LocalStorageService implements IStorageService {
  private readonly storageKeyPrefix: string;

  constructor(keyPrefix: string = 'tehtavaapp_') {
    this.storageKeyPrefix = keyPrefix;
  }

  getItem<T>(key: string): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const itemStr = localStorage.getItem(fullKey);
      
      if (!itemStr) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(itemStr);

      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error(`Error retrieving item from localStorage: ${key}`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T, expiryInMs?: number): void {
    try {
      const fullKey = this.getFullKey(key);
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: expiryInMs ? Date.now() + expiryInMs : undefined
      };

      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  removeItem(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  }

  clear(): void {
    try {
      // Only clear items with our prefix
      const keys = this.keys();
      keys.forEach(key => this.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  keys(): string[] {
    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storageKeyPrefix)) {
          // Remove prefix from key
          allKeys.push(key.substring(this.storageKeyPrefix.length));
        }
      }
      return allKeys;
    } catch (error) {
      console.error('Error getting localStorage keys', error);
      return [];
    }
  }

  private getFullKey(key: string): string {
    return `${this.storageKeyPrefix}${key}`;
  }
}

// Export a default instance
export const localStorageService = new LocalStorageService();

