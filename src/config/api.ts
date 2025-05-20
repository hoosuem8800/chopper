// API configuration
const getApiBaseUrl = () => {
  // In production, use relative URL which will be handled by the web server
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use the proxy configuration
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}; 