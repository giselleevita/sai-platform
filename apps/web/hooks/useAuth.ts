import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for CSRF token (cookies are checked by server)
    const csrfToken = localStorage.getItem('csrf-token');
    const legacyToken = localStorage.getItem('token');
    setIsAuthenticated(!!(csrfToken || legacyToken));
    
    if (!csrfToken && !legacyToken) {
      router.push('/auth/login');
    }
  }, [router]);

  const logout = async () => {
    try {
      // Logout endpoint now uses cookies, no need to send token
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens anyway
      localStorage.removeItem('csrf-token');
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  return {
    isAuthenticated,
    logout,
  };
}
