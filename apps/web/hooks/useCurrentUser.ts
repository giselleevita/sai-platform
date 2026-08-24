'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: 'MANAGEMENT' | 'ADMIN' | 'AUDITOR' | 'OPERATOR' | string;
  company?: {
    id: string;
    name: string;
    email: string;
  };
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void api.get<CurrentUser>('/api/auth/me').then((res) => {
      if (mounted && res.success) setUser(res.data || null);
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const permissions = useMemo(() => {
    const role = user?.role;
    return {
      canCreate: role === 'MANAGEMENT' || role === 'ADMIN' || role === 'OPERATOR',
      canApprove: role === 'MANAGEMENT' || role === 'ADMIN',
      canDelete: role === 'MANAGEMENT' || role === 'ADMIN',
      isReadOnly: role === 'AUDITOR',
    };
  }, [user?.role]);

  return { user, loading, ...permissions };
}
