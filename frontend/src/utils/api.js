/**
 * Get the API base URL for making backend requests
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (if set)
 * 2. Try to infer from current location for common deployment patterns
 * 3. Default to localhost:5000 for local development
 * 
 * For production deployments, it's recommended to set NEXT_PUBLIC_API_URL.
 * 
 * Common deployment patterns:
 * - Single domain with reverse proxy: NEXT_PUBLIC_API_URL=/api or same origin
 * - Separate subdomains: NEXT_PUBLIC_API_URL=https://api.example.com
 * - CapRover: NEXT_PUBLIC_API_URL=https://backend-app.your-domain.com
 * 
 * @returns {string} The API base URL
 */
export function getApiUrl() {
  // Check for environment variable first (preferred for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // For client-side, try to infer from current location
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // If running on a deployed domain (not localhost), try intelligent defaults
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Common pattern 1: Backend on same host, different port (e.g., backend on :5000)
      // This works for simple deployments where both are on same server
      if (port && port !== '80' && port !== '443') {
        // Frontend is on custom port, try backend on 5000
        return `${protocol}//${hostname}:5000`;
      }
      
      // Common pattern 2: Same origin (works with reverse proxy)
      // Many deployments use nginx/traefik to route /api -> backend
      return `${protocol}//${hostname}`;
    }
    
    // For localhost development, backend is typically on port 5000
    return 'http://localhost:5000';
  }
  
  // Fallback for server-side rendering (shouldn't normally happen for API calls)
  return 'http://localhost:5000';
}
