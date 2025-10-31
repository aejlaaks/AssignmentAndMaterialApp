import { IMaterialService } from '../interfaces/services/IMaterialService';
import { MaterialServiceImpl } from './materials/MaterialServiceImpl';
import { IAssignmentService } from '../interfaces/services/IAssignmentService';
import { AssignmentServiceImpl } from './assignments/AssignmentServiceImpl';
import { IGroupService } from '../interfaces/services/IGroupService';
import { GroupServiceImpl } from './courses/GroupServiceImpl';

/**
 * Service Provider
 * 
 * This is a singleton class that provides access to all application services.
 * It follows the Dependency Inversion Principle by providing abstract service interfaces
 * rather than concrete implementations.
 * 
 * Components should use this provider to get service instances rather than
 * importing service implementations directly.
 */
class ServiceProvider {
  private static instance: ServiceProvider;
  private materialService: IMaterialService;
  private assignmentService: IAssignmentService;
  private groupService: IGroupService;
  
  private constructor() {
    // Initialize concrete service implementations
    this.materialService = new MaterialServiceImpl();
    this.assignmentService = new AssignmentServiceImpl();
    this.groupService = new GroupServiceImpl();
  }
  
  /**
   * Get the singleton instance of the service provider
   */
  public static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }
  
  /**
   * Get the material service implementation
   */
  public getMaterialService(): IMaterialService {
    return this.materialService;
  }
  
  /**
   * Get the assignment service implementation
   */
  public getAssignmentService(): IAssignmentService {
    return this.assignmentService;
  }
  
  /**
   * Get the group service implementation
   */
  public getGroupService(): IGroupService {
    return this.groupService;
  }
  
  /**
   * For testing: Replace the material service with a mock implementation
   */
  public setMaterialService(service: IMaterialService): void {
    this.materialService = service;
  }
  
  /**
   * For testing: Replace the assignment service with a mock implementation
   */
  public setAssignmentService(service: IAssignmentService): void {
    this.assignmentService = service;
  }
  
  /**
   * For testing: Replace the group service with a mock implementation
   */
  public setGroupService(service: IGroupService): void {
    this.groupService = service;
  }
}

// Export a singleton instance
export const serviceProvider = ServiceProvider.getInstance(); 