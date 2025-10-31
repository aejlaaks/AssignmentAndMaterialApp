/**
 * Storage services following SOLID principles.
 * Provides abstractions for different storage mechanisms.
 */
export { IStorageService, StorageItem } from './IStorageService';
export { LocalStorageService, localStorageService } from './LocalStorageService';
export { SessionStorageService, sessionStorageService } from './SessionStorageService';
export { InMemoryCacheService, inMemoryCacheService } from './InMemoryCacheService';

