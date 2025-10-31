import { API_URL } from './apiConfig';

// Debug log to see the actual API_URL in production
console.log('IMAGE UTILS - API_URL:', API_URL);

/**
 * Converts a direct blob storage URL to a proxy URL that works with private storage
 * 
 * @param originalUrl The original blob storage URL
 * @returns Proxied URL that can access the image
 */
export function getFixedImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return '';
  }
  
  // Add debug logging
  console.log(`Processing image URL: ${originalUrl}`);
  
  // Check if this is a blob storage URL that needs fixing (more general pattern)
  if (originalUrl.includes('tehtavatblocproduction.blob.core.windows.net')) {
    // Extract the filename from the URL
    const filename = originalUrl.split('/').pop();
    if (filename) {
      // Make sure we don't add duplicate /api prefix
      // Extract the base URL without the trailing /api if it exists
      const baseUrl = API_URL.endsWith('/api') 
        ? API_URL 
        : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}api`;
      
      const proxyUrl = `${baseUrl}/image/${filename}`;
      console.log(`Converted blob URL to: ${proxyUrl}`);
      return proxyUrl;
    }
  }
  
  // For all other URLs, return as is
  return originalUrl;
}

/**
 * For more complex cases, you can use the proxy endpoint directly
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return '';
  }
  
  // Get the appropriate base URL
  const baseUrl = API_URL.endsWith('/api') 
    ? API_URL 
    : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}api`;
  
  // Use the proxy endpoint with the full URL as a parameter
  return `${baseUrl}/image/proxy?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Fixes all image URLs in a string of HTML or markdown
 * 
 * @param content HTML or markdown content
 * @returns Content with fixed image URLs
 */
export function fixContentImageUrls(content: string): string {
  if (!content) {
    return '';
  }
  
  // This regex finds all blob storage URLs with various patterns
  const blobUrlRegex = /(https?:\/\/tehtavatblocproduction\.blob\.core\.windows\.net\/[^"'\s\)]+)/g;
  
  // Log how many matches we found
  const matches = content.match(blobUrlRegex);
  if (matches) {
    console.log(`Found ${matches.length} blob storage URLs in content`);
    matches.forEach(url => console.log(`Found URL: ${url}`));
  }
  
  // Replace all matching URLs with their fixed versions
  return content.replace(blobUrlRegex, (match) => {
    return getFixedImageUrl(match);
  });
}

/**
 * Auto-fixes all image src attributes in the DOM that point to blob storage
 * Call this in your main component to catch any direct image references
 */
export function patchAllImagesInDom(): void {
  // Run this after a short delay to ensure the DOM is loaded
  setTimeout(() => {
    try {
      console.log('Patching all images in DOM to use proxy...');
      
      // Get all images in the document
      const images = document.querySelectorAll('img');
      console.log(`Found ${images.length} images in DOM`);
      
      // Track how many images we fixed
      let fixedCount = 0;
      
      // Check each image
      images.forEach(img => {
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          // Log the original URL to help with debugging
          console.log(`Checking image src: ${originalSrc}`);
          
          if (originalSrc.includes('tehtavatblocproduction.blob.core.windows.net')) {
            // Fix the URL
            const newSrc = getFixedImageUrl(originalSrc);
            if (newSrc !== originalSrc) {
              img.setAttribute('src', newSrc);
              fixedCount++;
              console.log(`Fixed image src: ${originalSrc} -> ${newSrc}`);
            }
          } else if (originalSrc.includes('/api/api/image/')) {
            // Fix duplicate API paths that may have occurred
            const correctedSrc = originalSrc.replace('/api/api/image/', '/api/image/');
            img.setAttribute('src', correctedSrc);
            fixedCount++;
            console.log(`Fixed duplicate API path: ${originalSrc} -> ${correctedSrc}`);
          }
        }
      });
      
      console.log(`Fixed ${fixedCount} direct image references in DOM`);
    } catch (error) {
      console.error('Error patching DOM images:', error);
    }
  }, 1000); // 1 second delay
} 