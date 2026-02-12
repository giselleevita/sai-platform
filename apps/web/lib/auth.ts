/**
 * Auth utility functions
 * Handles cookie-based authentication with CSRF tokens.
 */

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!match) return null;
  const value = match.slice(prefix.length);
  return decodeURIComponent(value);
}

/**
 * Get CSRF token from cookie first, then localStorage fallback.
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;

  const cookieToken = getCookie('csrf-token');
  if (cookieToken) return cookieToken;

  return localStorage.getItem('csrf-token');
}

/**
 * Check whether a user likely has an authenticated browser session.
 */
export function hasAuthSession(): boolean {
  if (typeof window === 'undefined') return false;

  const csrfToken = getCsrfToken();
  if (csrfToken) return true;

  // Legacy fallback while old auth flow exists in some pages
  const legacyToken = localStorage.getItem('token');
  return !!legacyToken;
}

/**
 * Backward-compatible alias.
 */
export function isAuthenticated(): boolean {
  return hasAuthSession();
}

/**
 * Clear client-side auth artifacts.
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('csrf-token');
  localStorage.removeItem('token');
}
