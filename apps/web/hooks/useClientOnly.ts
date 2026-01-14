import { useEffect, useState } from 'react';

/**
 * Hook to prevent hydration mismatches
 * Returns true only after component has mounted on client
 */
export function useClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
