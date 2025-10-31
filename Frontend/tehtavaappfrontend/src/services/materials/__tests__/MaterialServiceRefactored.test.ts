import { MaterialServiceRefactored } from '../MaterialServiceRefactored';
import { MaterialApiClient } from '../MaterialApiClient';
import { MaterialCacheService } from '../MaterialCacheService';
import { InMemoryCacheService } from '../../storage/InMemoryCacheService';
import { Material } from '../../../types';

/**
 * Integration tests for MaterialServiceRefactored
 * Tests the orchestration between API client and cache service
 */
describe('MaterialServiceRefactored', () => {
  let service: MaterialServiceRefactored;
  let apiClient: MaterialApiClient;
  let cacheService: MaterialCacheService;
  let storageService: InMemoryCacheService;

  const mockMaterial: Material = {
    id: '1',
    title: 'Test Material',
    description: 'Test Description',
    type: 'PDF',
    courseId: 'course1',
    createdById: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    // Use in-memory storage for testing
    storageService = new InMemoryCacheService();
    cacheService = new MaterialCacheService(storageService);
    apiClient = new MaterialApiClient();
    service = new MaterialServiceRefactored(apiClient, cacheService);
  });

  afterEach(() => {
    storageService.clear();
  });

  describe('Cache-aside pattern', () => {
    it('should fetch from API and cache the result', async () => {
      // Mock API response
      jest.spyOn(apiClient, 'getMaterialsByCourseId').mockResolvedValue([mockMaterial]);

      // First call - should hit API
      const materials = await service.getMaterialsByCourseId('course1');

      expect(apiClient.getMaterialsByCourseId).toHaveBeenCalledWith('course1');
      expect(materials).toEqual([mockMaterial]);

      // Verify cache was updated
      const cached = cacheService.getCourseMaterials('course1');
      expect(cached).toEqual([mockMaterial]);
    });

    it('should use cache on second call', async () => {
      // Pre-populate cache
      cacheService.setCourseMaterials('course1', [mockMaterial]);

      // Mock API (should not be called)
      jest.spyOn(apiClient, 'getMaterialsByCourseId').mockResolvedValue([mockMaterial]);

      // Call service
      const materials = await service.getMaterialsByCourseId('course1');

      expect(apiClient.getMaterialsByCourseId).not.toHaveBeenCalled();
      expect(materials).toEqual([mockMaterial]);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      // Pre-populate cache
      cacheService.setCourseMaterials('course1', [mockMaterial]);

      // Mock API
      const updatedMaterial = { ...mockMaterial, title: 'Updated Title' };
      jest.spyOn(apiClient, 'getMaterialsByCourseId').mockResolvedValue([updatedMaterial]);

      // Call with force refresh
      const materials = await service.getMaterialsByCourseId('course1', true);

      expect(apiClient.getMaterialsByCourseId).toHaveBeenCalledWith('course1');
      expect(materials).toEqual([updatedMaterial]);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when creating material', async () => {
      // Pre-populate cache
      cacheService.setCourseMaterials('course1', [mockMaterial]);

      // Mock API
      const newMaterial = { ...mockMaterial, id: '2', title: 'New Material' };
      jest.spyOn(apiClient, 'createMaterial').mockResolvedValue(newMaterial);

      // Create material
      await service.createMaterial({ title: 'New Material', courseId: 'course1' });

      // Cache should be invalidated
      const cached = cacheService.getCourseMaterials('course1');
      expect(cached).toBeNull();
    });

    it('should update cache when updating material', async () => {
      // Pre-populate cache
      cacheService.setCourseMaterials('course1', [mockMaterial]);

      // Mock API
      const updatedMaterial = { ...mockMaterial, title: 'Updated Title' };
      jest.spyOn(apiClient, 'updateMaterial').mockResolvedValue(updatedMaterial);

      // Update material
      await service.updateMaterial('1', { title: 'Updated Title' });

      // Cache should be updated
      const cached = cacheService.getCourseMaterials('course1');
      expect(cached?.[0].title).toBe('Updated Title');
    });

    it('should remove from cache when deleting material', async () => {
      // Pre-populate cache
      cacheService.setCourseMaterials('course1', [mockMaterial]);

      // Mock API
      jest.spyOn(apiClient, 'deleteMaterial').mockResolvedValue();

      // Delete material
      await service.deleteMaterial('1', 'course1');

      // Cache should be updated (material removed)
      const cached = cacheService.getCourseMaterials('course1');
      expect(cached).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      jest.spyOn(apiClient, 'getMaterialsByCourseId').mockRejectedValue(new Error('API Error'));

      // Should throw error
      await expect(service.getMaterialsByCourseId('course1')).rejects.toThrow('API Error');
    });

    it('should handle missing course ID', async () => {
      await expect(service.getMaterialsByCourseId('')).rejects.toThrow('Course ID is required');
    });
  });
});

