/**
 * Auth utility functions
 * Handles cookie-based authentication with CSRF tokens
 */

/**
 * Check if user is authenticated
 * Returns true if CSRF token exists (cookies are checked by server)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for CSRF token (primary method)
  const csrfToken = localStorage.getItem('csrf-token');
  if (csrfToken) return true;
  
  // Fallback to legacy token (for backward compatibility)
  const legacyToken = localStorage.getItem('token');
  return !!legacyToken;
}

/**
 * Get CSRF token
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('csrf-token');
}

/**
 * Clear all auth tokens
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('csrf-token');
  localStorage.removeItem('token'); // Legacy cleanup
}
