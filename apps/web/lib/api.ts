import { getCsrfToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  baseUrl: API_URL,

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const csrfToken = getCsrfToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    // Backward compatibility for legacy token-based pages.
    const legacyToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (legacyToken) {
      headers['Authorization'] = `Bearer ${legacyToken}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

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
