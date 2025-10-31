import { useState, useCallback } from 'react';
import { SchoolGroup } from '../types';

/**
 * Custom hook to manage dialogs in the course detail page
 * 
 * @returns Dialog-related state and handlers
 */
export const useCourseDialogs = () => {
  // Main dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'material' | 'assignment' | 'group'>('material');
  
  // Dialog tabs
  const [materialDialogTab, setMaterialDialogTab] = useState<'upload' | 'existing'>('upload');
  const [assignmentDialogTab, setAssignmentDialogTab] = useState<'create' | 'existing'>('create');
  const [groupDialogTab, setGroupDialogTab] = useState<'create' | 'existing'>('create');
  
  // Group-related dialogs
  const [selectedGroup, setSelectedGroup] = useState<SchoolGroup | null>(null);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SchoolGroup | null>(null);
  
  // Course edit dialog
  const [courseEditDialogOpen, setCourseEditDialogOpen] = useState(false);
  
  // Course deletion dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cleanupBeforeDelete, setCleanupBeforeDelete] = useState(true);

  /**
   * Opens the appropriate dialog based on type
   */
  const handleOpenDialog = useCallback((type: 'material' | 'assignment' | 'group') => {
    setDialogType(type);
    setDialogOpen(true);
  }, []);

  /**
   * Closes the currently open dialog
   */
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  /**
   * Opens the students dialog for a group
   */
  const handleShowStudents = useCallback((group: SchoolGroup) => {
    setSelectedGroup(group);
    setStudentsDialogOpen(true);
  }, []);

  /**
   * Opens the group edit dialog
   */
  const handleShowEditGroup = useCallback((group: SchoolGroup) => {
    setEditingGroup(group);
    setEditGroupDialogOpen(true);
  }, []);

  /**
   * Closes the group edit dialog
   */
  const handleCloseEditGroupDialog = useCallback(() => {
    setEditGroupDialogOpen(false);
    setEditingGroup(null);
  }, []);

  /**
   * Closes the students dialog
   */
  const handleCloseStudentsDialog = useCallback(() => {
    setStudentsDialogOpen(false);
    setSelectedGroup(null);
  }, []);

  /**
   * Handles tab change for the material dialog
   */
  const handleMaterialDialogTabChange = useCallback((_: React.SyntheticEvent, newValue: "upload" | "existing") => {
    setMaterialDialogTab(newValue);
  }, []);

  /**
   * Handles tab change for the assignment dialog
   */
  const handleAssignmentDialogTabChange = useCallback((_: React.SyntheticEvent, newValue: "existing" | "create") => {
    setAssignmentDialogTab(newValue);
  }, []);

  /**
   * Handles tab change for the group dialog
   */
  const handleGroupDialogTabChange = useCallback((_: React.SyntheticEvent, newValue: "existing" | "create") => {
    setGroupDialogTab(newValue);
  }, []);

  return {
    // Main dialog state
    dialogOpen,
    dialogType,
    
    // Dialog tabs
    materialDialogTab,
    assignmentDialogTab,
    groupDialogTab,
    
    // Group dialogs
    selectedGroup,
    studentsDialogOpen,
    editGroupDialogOpen,
    editingGroup,
    
    // Course edit dialog
    courseEditDialogOpen,
    setCourseEditDialogOpen,
    
    // Course deletion
    deleteDialogOpen,
    setDeleteDialogOpen,
    cleanupBeforeDelete,
    setCleanupBeforeDelete,

    // Handlers
    handleOpenDialog,
    handleCloseDialog,
    handleShowStudents,
    handleShowEditGroup,
    handleCloseEditGroupDialog,
    handleCloseStudentsDialog,
    handleMaterialDialogTabChange,
    handleAssignmentDialogTabChange,
    handleGroupDialogTabChange,
  };
}; 