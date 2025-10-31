/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @param decimals The number of decimal places to show
 * @returns A formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Gets the file extension from a filename
 * @param filename The filename
 * @returns The file extension (e.g., "pdf")
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Checks if a file is an image based on its MIME type
 * @param file The file to check
 * @returns True if the file is an image, false otherwise
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if a file is a PDF based on its MIME type
 * @param file The file to check
 * @returns True if the file is a PDF, false otherwise
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

/**
 * Checks if a file is a document (Word, Excel, PowerPoint, etc.)
 * @param file The file to check
 * @returns True if the file is a document, false otherwise
 */
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  return documentTypes.includes(file.type);
}; 