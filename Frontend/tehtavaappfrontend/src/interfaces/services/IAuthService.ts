import { User, LoginCredentials } from '../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface IAuthService {
  /**
   * Login a user with email and password
   */
  login(credentials: LoginCredentials): Promise<User>;
  
  /**
   * Register a new user
   */
  register(request: RegisterRequest): Promise<User>;
  
  /**
   * Logout the current user
   */
  logout(): Promise<void>;
  
  /**
   * Get the current user
   */
  getCurrentUser(): User | null;
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean;
  
  /**
   * Get the authentication token
   */
  getToken(): string | null;
  
  /**
   * Update the current user's profile
   */
  updateProfile(updatedUserData: Partial<User>): Promise<User>;
} 