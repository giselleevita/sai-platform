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
 * After OIDC redirect the CSRF value is often only in the cookie; mirror it to localStorage
 * so older code paths that only read localStorage still work.
 */
export function syncCsrfFromCookieToStorage(): void {
  if (typeof window === 'undefined') return;
  const fromCookie = getCookie('csrf-token');
  if (fromCookie) {
    localStorage.setItem('csrf-token', fromCookie);
  }
}

/**
 * Check whether a user likely has an authenticated browser session.
 */
export function hasAuthSession(): boolean {
  if (typeof window === 'undefined') return false;

  const csrfToken = getCsrfToken();
  if (csrfToken) return true;
  return false;
}

/**
 * Mirror CSRF from cookie, then redirect to login if there is no session.
 * Prefer this over reading legacy `token` from localStorage.
 */
export function redirectToLoginIfNoSession(router: { push: (path: string) => void }): boolean {
  if (typeof window === 'undefined') return false;
  syncCsrfFromCookieToStorage();
  if (!hasAuthSession()) {
    router.push('/auth/login');
    return true;
  }
  return false;
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
}
