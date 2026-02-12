import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { hasAuthSession, clearAuth } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const authenticated = hasAuthSession();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      router.push('/auth/login');
    }
  }, [router]);

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/auth/login');
    }
  };

  return {
    isAuthenticated,
    logout,
  };
}
