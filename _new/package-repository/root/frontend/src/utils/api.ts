/**
 * API URL resolution utilities for packagerepo frontend.
 * Determines the correct backend URL based on environment
 * and deployment context.
 */

/** Default backend port for local development. */
const DEFAULT_BACKEND_PORT = '5050';

/** Default local backend URL. */
const DEFAULT_LOCAL_URL =
  `http://localhost:${DEFAULT_BACKEND_PORT}`;

/**
 * Get the API base URL for making backend requests.
 *
 * In the browser, returns empty string so requests use
 * the Next.js rewrite proxy (avoids CORS). On the server
 * or when NEXT_PUBLIC_API_URL is set, returns the direct
 * backend URL.
 *
 * @returns The API base URL string
 */
export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL !== undefined) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    // Prefix with basePath so `${apiUrl}/v1/...` resolves to
    // `/repo/v1/...` (nginx /repo route + Next.js standalone
    // rewrite to the backend). Without this, `fetch('/v1/...')`
    // bypasses the basePath and 404s on the host root.
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
  }

  return DEFAULT_LOCAL_URL;
}

/**
 * Get the full display URL for documentation examples.
 *
 * Unlike {@link getApiUrl}, this always returns a
 * user-visible URL suitable for curl examples and docs.
 * Respects NEXT_PUBLIC_API_URL when set.
 *
 * @returns The full backend URL for display purposes
 */
export function getDisplayApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_LOCAL_URL
  );
}
