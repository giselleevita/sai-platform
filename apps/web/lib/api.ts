const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get CSRF token from cookie or localStorage (fallback)
function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='));
  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }
  
  // Fallback to localStorage (for backward compatibility during transition)
  return localStorage.getItem('csrf-token');
}

export const api = {
  baseUrl: API_URL,
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    // Get CSRF token
    const csrfToken = getCsrfToken();
    
    // Build headers - cookies are sent automatically, but we need CSRF token in header
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...(options.headers as Record<string, string> || {}),
    };

    // For backward compatibility, still send Authorization header if token exists in localStorage
    const legacyToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (legacyToken) {
      headers['Authorization'] = `Bearer ${legacyToken}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Important: Include cookies in requests
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          return {
            success: false,
            error: text || `Request failed with status ${response.status}`,
          };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      // Better error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Cannot connect to server. Make sure the backend is running on http://localhost:3001',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};
