import axios from 'axios';
import { type LoginCredentials, type User, UserRole } from '../../types';
import { API_URL, logApiCall } from '../../utils/apiConfig';

class AuthService {
  private baseUrl = `${API_URL}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  private parseJwt(token: string | undefined | null) {
    if (!token) {
      console.error('Token is undefined or null');
      return null;
    }
    
    try {
      // Tarkistetaan, että token on oikeassa muodossa
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format: token should have three parts');
        return null;
      }
      
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Käytetään window.atob turvallisesti
      let jsonPayload;
      try {
        const decodedData = window.atob(base64);
        jsonPayload = decodeURIComponent(
          Array.from(decodedData)
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch (error) {
        console.error('Error decoding base64:', error);
        return null;
      }
      
      const payload = JSON.parse(jsonPayload);
      console.log('Raw JWT payload:', payload);
      return payload;
    } catch (e) {
      console.error('Failed to parse JWT:', e);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Sending login request with credentials:', { email: credentials.email, password: '***' });
      
      const response = await axios.post(`${this.baseUrl}/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      console.log('Login response:', data);
      
      // Check that the response is valid
      if (!data) {
        console.error('Empty login response');
        throw new Error('No response received from login service');
      }
      
      // Check that the token exists
      if (!data.token) {
        console.error('Token missing from response:', data);
        throw new Error('Token missing from response');
      }
      
      // Store token
      this.setToken(data.token);
      
      // Parse JWT to get user info
      const tokenPayload = this.parseJwt(data.token);
      console.log('Token payload:', tokenPayload);
      
      if (!tokenPayload) {
        throw new Error('Failed to parse token data');
      }
      
      // .NET Core JWT claims
      const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
      const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
      const emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
      const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      
      // Use token data first, then response data as fallback
      const userId = tokenPayload[nameIdentifierClaim] || (data.user?.id || 'unknown');
      const userEmail = tokenPayload[emailClaim] || data.user?.email || '';
      const rawRole = tokenPayload[roleClaim] || data.user?.role || 'Student';
      
      console.log('Extracted role information:', {
        rawRole,
        roleFromToken: tokenPayload[roleClaim],
        roleFromUser: data.user?.role
      });
      
      // Convert role to UserRole enum
      let userRole: UserRole;
      
      // Normalize role to lowercase for consistent comparison
      const rawRoleLower = String(rawRole).toLowerCase();
      
      // Use pattern matching for more robust role detection
      switch (true) {
        case /admin/i.test(rawRoleLower):
          userRole = UserRole.Admin;
          break;
        case /teach/i.test(rawRoleLower): // Match 'teacher', 'Teacher', 'opettaja', etc.
          userRole = UserRole.Teacher;
          break;
        case /student/i.test(rawRoleLower):
        case /oppilas/i.test(rawRoleLower):
          userRole = UserRole.Student;
          break;
        default:
          console.warn('Unknown role in token, defaulting to Student:', rawRole);
          userRole = UserRole.Student;
      }
      
      console.log('Role conversion result:', {
        before: rawRole,
        normalized: rawRoleLower,
        after: userRole
      });
      
      // Store user data
      const userData: User = {
        id: userId,
        email: userEmail,
        firstName: data.user?.firstName || '',
        lastName: data.user?.lastName || '',
        role: userRole,
        token: data.token
      };
      
      console.log('Storing user data:', {
        ...userData,
        token: userData.token ? `${userData.token.substring(0, 10)}...` : null
      });
      
      localStorage.setItem(this.userKey, JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/logout`, null, {
        headers: this.getHeaders()
      });
    } finally {
      this.clearToken();
      localStorage.removeItem(this.userKey);
    }
  }

  async updateProfile(updatedUserData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(`${this.baseUrl}/profile`, updatedUserData, {
        headers: this.getHeaders()
      });

      const data = response.data;
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  private setToken(token: string): void {
    // Store token in all possible locations for consistency
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    console.log('Token stored in localStorage under multiple keys for compatibility');
  }

  private clearToken(): void {
    // Clear all token locations
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    console.log('All token references cleared from localStorage');
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    return token;
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) {
      console.log('No user data found in localStorage');
      return null; // Return null if no user is logged in
    }
    
    try {
      const user = JSON.parse(userJson);
      console.log('User data from localStorage:', {
        id: user.id,
        email: user.email,
        role: user.role,
        roleType: typeof user.role
      });
      
      // Convert user role to enum string with improved case insensitivity
      let userRole: UserRole;
      
      // First normalize the role to lowercase for comparison
      const rawRoleLower = String(user.role || '').toLowerCase();
      console.log('Normalized role for processing:', rawRoleLower);
      
      // Then map to proper enum values with extra checks for potential role variations
      switch (true) {
        case /admin/i.test(rawRoleLower):
          userRole = UserRole.Admin;
          break;
        case /teach/i.test(rawRoleLower): // Match 'teacher', 'Teacher', 'opettaja', etc
          userRole = UserRole.Teacher;
          break;
        case /student/i.test(rawRoleLower):
        case /oppilas/i.test(rawRoleLower):
          userRole = UserRole.Student;
          break;
        default:
          console.warn('Unknown role detected:', user.role);
          // Default to Student role if unknown
          userRole = UserRole.Student;
      }
      
      console.log('Role conversion result:', {
        before: user.role,
        after: userRole
      });
      
      return {
        ...user,
        role: userRole
      };
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }

  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem(this.tokenKey);
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
}

export const authService = new AuthService();
