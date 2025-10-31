import axios from 'axios';
import { User, UserRole } from '../../types';
import { authService } from '../auth/authService';
import { API_BASE_URL, API_URL } from '../../utils/apiConfig';

// Create axios instance with default auth headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Käyttäjälomakkeen tyyppi (sama kuin UserManagement.tsx:ssä)
interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password?: string;
  isNewUser?: boolean;
}

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>(`/auth/users`);
    return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
    const response = await api.get<User>(`/user/${id}`);
    return response.data;
};

export const getUserProfile = async (): Promise<User> => {
    const response = await api.get<User>(`/user/profile`);
    return response.data;
};

export const updateUserProfile = async (user: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/user/profile`, user);
    return response.data;
};

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/user/search`, {
        params: { searchTerm }
    });
    return response.data;
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/user/roles/${role}`);
    return response.data;
};

export const deactivateUser = async (userId: string): Promise<void> => {
    await api.post(`/user/${userId}/deactivate`);
};

export const reactivateUser = async (userId: string): Promise<void> => {
    await api.post(`/user/${userId}/reactivate`);
};

export const changeUserRole = async (userId: string, role: string): Promise<void> => {
    await api.post(`/auth/users/${userId}/role`, JSON.stringify(role), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const createUser = async (userData: UserFormData): Promise<User> => {
    // Muokataan käyttäjädata vastaamaan backend-vaatimuksia
    const registerData = {
        email: userData.email,
        password: userData.password || '', // Varmistetaan, että password on määritelty
        confirmPassword: userData.password || '', // Lisätään ConfirmPassword-kenttä
        userName: userData.email, // Käytetään sähköpostia käyttäjänimenä, jos ei ole määritelty
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
    };
    
    const response = await api.post<User>(`/auth/register`, registerData);
    return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await api.delete(`/auth/users/${userId}`);
};

export const getTeachers = async (): Promise<User[]> => {
    try {
        const response = await api.get<User[]>(`/user/roles/Teacher`);
        return response.data;
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
    }
};
