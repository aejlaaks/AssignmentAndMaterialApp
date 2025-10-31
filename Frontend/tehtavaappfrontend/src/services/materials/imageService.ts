import axios from 'axios';
import { authService } from '../auth/authService';
import { API_URL } from '../../utils/apiConfig';

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

export interface IUploadedImage {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
}

export const uploadImage = async (file: File, courseId?: string): Promise<IUploadedImage> => {
  // Generate a more descriptive title and description
  const title = file.name.split('.')[0] || 'Image';
  const fileSize = (file.size / 1024 / 1024).toFixed(2);
  const fileType = file.type.split('/')[1].toUpperCase();
  const description = `${fileType} image uploaded on ${new Date().toLocaleDateString()}. Size: ${fileSize}MB. For use in course content.`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('type', 'Image');
  
  if (courseId) {
    formData.append('courseId', courseId);
  }

  const token = authService.getToken();
  const response = await axios.post<IUploadedImage>(`${API_URL}/Material`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};
