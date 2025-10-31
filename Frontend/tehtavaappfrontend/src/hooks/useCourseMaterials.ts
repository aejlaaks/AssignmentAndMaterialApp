import { useState, useCallback } from 'react';
import { Material } from '../types';
import { materialServiceRefactored } from '../services/materials/MaterialServiceRefactored';

/**
 * Custom hook for managing course materials.
 * Follows the Single Responsibility Principle by focusing on materials state management.
 * Encapsulates material fetching, caching, and CRUD operations.
 */
export const useCourseMaterials = (courseId?: string) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch materials for a course
   */
  const fetchMaterials = useCallback(async (forceRefresh: boolean = false) => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedMaterials = await materialServiceRefactored.getMaterialsByCourseId(
        courseId,
        forceRefresh
      );
      setMaterials(fetchedMaterials);
    } catch (err: any) {
      console.error('Error fetching materials:', err);
      setError(err.message || 'Failed to fetch materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  /**
   * Refresh materials (force refresh from API)
   */
  const refreshMaterials = useCallback(async () => {
    return await fetchMaterials(true);
  }, [fetchMaterials]);

  /**
   * Add a new material
   */
  const addMaterial = useCallback(async (material: Partial<Material>) => {
    setLoading(true);
    setError(null);

    try {
      const created = await materialServiceRefactored.createMaterial(material);
      setMaterials(prev => [...prev, created]);
      return { success: true, material: created };
    } catch (err: any) {
      console.error('Error adding material:', err);
      setError(err.message || 'Failed to add material');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a material with file
   */
  const uploadMaterial = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const uploaded = await materialServiceRefactored.uploadMaterial(formData);
      setMaterials(prev => [...prev, uploaded]);
      return { success: true, material: uploaded };
    } catch (err: any) {
      console.error('Error uploading material:', err);
      setError(err.message || 'Failed to upload material');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing material
   */
  const updateMaterial = useCallback(async (id: string, updates: Partial<Material>) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await materialServiceRefactored.updateMaterial(id, updates);
      setMaterials(prev => prev.map(m => m.id === id ? updated : m));
      return { success: true, material: updated };
    } catch (err: any) {
      console.error('Error updating material:', err);
      setError(err.message || 'Failed to update material');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a material
   */
  const deleteMaterial = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await materialServiceRefactored.deleteMaterial(id, courseId);
      setMaterials(prev => prev.filter(m => m.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting material:', err);
      setError(err.message || 'Failed to delete material');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    refreshMaterials,
    addMaterial,
    uploadMaterial,
    updateMaterial,
    deleteMaterial
  };
};
