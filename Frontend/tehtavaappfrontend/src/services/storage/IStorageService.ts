/**
 * Storage service interface for managing client-side data storage.
 * Follows the Dependency Inversion Principle by providing an abstraction
 * that can be implemented by different storage mechanisms.
 * Follows the Open/Closed Principle by allowing new storage implementations
 * without modifying existing code.
 */
export interface IStorageService {
  /**
   * Retrieve an item from storage
   * @param key The key to retrieve
   * @returns The value associated with the key, or null if not found
   */
  getItem<T>(key: string): T | null;

  /**
   * Store an item in storage
   * @param key The key to store the value under
   * @param value The value to store
   * @param expiryInMs Optional expiry time in milliseconds
   */
  setItem<T>(key: string, value: T, expiryInMs?: number): void;

  /**
   * Remove an item from storage
   * @param key The key to remove
   */
  removeItem(key: string): void;

  /**
   * Clear all items from storage
   */
  clear(): void;

  /**
   * Check if a key exists in storage
   * @param key The key to check
   */
  has(key: string): boolean;

  /**
   * Get all keys in storage
   */
  keys(): string[];
}

/**
 * Wrapper for stored items with metadata
 */
export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

