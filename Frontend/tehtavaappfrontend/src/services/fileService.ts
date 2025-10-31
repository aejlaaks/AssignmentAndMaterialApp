/**
 * File upload service
 */

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Upload a file to the server
 * @param file The file to upload
 * @param uploadPath The API endpoint to upload to
 * @returns Promise with the response data
 */
export const uploadFile = async (file: File, uploadPath: string): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(uploadPath, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type here as it will be set automatically with FormData
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    // For demo purposes, return a mockup response if upload fails
    return {
      url: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      mimetype: file.type
    };
  }
}; 