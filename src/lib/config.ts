// Environment configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
    api_version: process.env.EXPO_PUBLIC_API_VERSION || 'v2',
    timeout: 30000, // 30 seconds
  },
  
  // App Configuration
  app: {
    name: 'Pivot',
    version: '0.0.1',
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['pdf', 'docx', 'txt'],
    allowedAudioTypes: ['wav', 'mp3', 'm4a'],
  },
};

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '')+"/"+config.api.api_version.replace(/\/$/, ''); 
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}
