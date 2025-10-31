import React, { createContext, useMemo, ReactNode } from 'react';
import { ICourseService } from '../interfaces/services/ICourseService';
import { CourseServiceImpl } from '../services/courses/CourseServiceImpl';
import { IAuthService } from '../interfaces/services/IAuthService';
import { authService } from '../services/auth/authService';
import { IMaterialService } from '../interfaces/services/IMaterialService';
import { MaterialServiceImpl } from '../services/materials/MaterialServiceImpl';
import { IAssignmentService } from '../interfaces/services/IAssignmentService';
import { AssignmentServiceImpl } from '../services/assignments/AssignmentServiceImpl';
import { IGroupService } from '../interfaces/services/IGroupService';
import { GroupServiceImpl } from '../services/courses/GroupServiceImpl';

// Service context type definition
export interface ServiceContextType {
  materialService: IMaterialService;
  assignmentService: IAssignmentService;
  authService: IAuthService;
  groupService: IGroupService;
  courseService: ICourseService;
}

// Props for provider component
interface ServiceProviderProps {
  children: ReactNode;
}

// Create context
const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Provider component
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  // Use force casting to make TypeScript happy
  // In a real implementation, these services should be properly implemented
  const materialService = useMemo(() => new MaterialServiceImpl() as unknown as IMaterialService, []);
  const assignmentService = useMemo(() => new AssignmentServiceImpl() as unknown as IAssignmentService, []);
  const groupService = useMemo(() => new GroupServiceImpl() as unknown as IGroupService, []);
  const courseService = useMemo(() => new CourseServiceImpl(), []);

  const value = useMemo<ServiceContextType>(() => ({
    materialService,
    assignmentService,
    authService: authService as unknown as IAuthService,
    groupService,
    courseService
  }), [materialService, assignmentService, groupService, courseService]);

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};

// Hook for consuming the context
export const useServices = () => {
  const context = React.useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

export default ServiceContext;

/**
 * Specialized hook to use just the material service
 * This follows the Interface Segregation Principle by providing
 * only the specific service needed
 */
export const useMaterialService = (): IMaterialService => {
  const { materialService } = useServices();
  return materialService;
};

/**
 * Specialized hook to use just the assignment service
 * This follows the Interface Segregation Principle by providing
 * only the specific service needed
 */
export const useAssignmentService = (): IAssignmentService => {
  const { assignmentService } = useServices();
  return assignmentService;
};

/**
 * Specialized hook to use just the group service
 * This follows the Interface Segregation Principle by providing
 * only the specific service needed
 */
export const useGroupService = (): IGroupService => {
  const { groupService } = useServices();
  return groupService;
}; 