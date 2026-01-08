/**
 * Get the API base URL for making backend requests
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (if set) - RECOMMENDED for production
 * 2. Try to infer from current location for common deployment patterns
 * 3. Default to localhost:5000 for local development
 * 
 * For production deployments, it's strongly recommended to set NEXT_PUBLIC_API_URL.
 * 
 * Common deployment patterns:
 * - Single domain with Next.js rewrites: Set NEXT_PUBLIC_API_URL="" (empty string)
 *   Backend routes (/auth/*, /v1/*) will be proxied by Next.js to the backend
 * - Separate subdomains: Set NEXT_PUBLIC_API_URL=https://api.example.com
 * - CapRover/separate apps: Set NEXT_PUBLIC_API_URL=https://backend-app.your-domain.com
 * - Same host, different port: Will auto-detect if frontend is on non-standard port
 * 
 * When NEXT_PUBLIC_API_URL is not set:
 * - For localhost: defaults to http://localhost:5000 (standard backend dev port)
 * - For deployed sites on custom port: tries backend on port 5000 (uncommon but supported)
 * - For deployed sites on standard ports: returns empty string to use Next.js rewrites
 * 
 * @returns {string} The API base URL
 */
export function getApiUrl() {
  // Check for environment variable first (preferred for production)
  if (process.env.NEXT_PUBLIC_API_URL !== undefined) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // For client-side, try to infer from current location
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    
    // If running on a deployed domain (not localhost), try intelligent defaults
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Pattern 1: Frontend on custom port (e.g., :3000) - try backend on :5000
      // This handles the case where both are on the same host with different ports
      // Note: This is uncommon in production but may occur in some deployments
      if (port && port !== '80' && port !== '443') {
        return `${protocol}//${hostname}:5000`;
      }
      
      // Pattern 2: Same origin with Next.js rewrites
      // Return empty string to use relative URLs, which will be handled by Next.js rewrites
      // This works when backend routes are proxied through Next.js
      return '';
    }
    
    // For localhost development, backend is typically on port 5000
    return 'http://localhost:5000';
  }
  
  // Fallback for server-side rendering (shouldn't normally happen for API calls)
  return 'http://localhost:5000';
}
