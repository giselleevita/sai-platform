'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oidcEnabled, setOidcEnabled] = useState(false);

  useEffect(() => {
    fetch(`${api.baseUrl}/api/health/oidc`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { oidcEnabled: false }))
      .then((d: { oidcEnabled?: boolean }) => setOidcEnabled(!!d.oidcEnabled))
      .catch(() => setOidcEnabled(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oidc_failed') {
      const msg = params.get('message') || 'SSO sign-in failed.';
      setError(msg);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.post('/api/auth/login', formData);

      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Store CSRF token from response (cookies are set automatically by server)
      const loginData = result.data as any;
      if (loginData?.csrfToken) {
        localStorage.setItem('csrf-token', loginData.csrfToken);
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Fallback: check if we have user data (login might have succeeded)
        if (loginData?.user) {
          // CSRF token might be in cookie, try to proceed
          router.push('/dashboard');
        } else {
          setError('Login successful but no CSRF token received');
          setLoading(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(`Failed to connect to API: ${errorMessage}. Make sure the backend is running.`);
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Secure AI Integration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your AI tools
          </p>
        </div>

        {oidcEnabled && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${api.baseUrl}/api/auth/oidc/login`;
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with SSO
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="you@company.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup link */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Create one
          </Link>
        </p>

        {/* Demo Credentials */}
        <div className="mt-8 rounded-md bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</p>
          <p className="mt-1 text-xs text-blue-700 mb-1">
            Email: <code className="bg-blue-100 px-1 py-0.5 rounded">test@sai.com</code>
          </p>
          <p className="text-xs text-blue-700 mb-2">
            Password: <code className="bg-blue-100 px-1 py-0.5 rounded">Password123</code>
          </p>
          <button
            type="button"
            onClick={async () => {
              setFormData({
                email: 'test@sai.com',
                password: 'Password123',
              });
              // Auto-submit after filling
              setTimeout(async () => {
                setError('');
                setLoading(true);
                try {
                  const result = await api.post('/api/auth/login', {
                    email: 'test@sai.com',
                    password: 'Password123',
                  });

                  if (!result.success) {
                    setError(result.error || 'Login failed');
                    setLoading(false);
                    return;
                  }

                  // Store CSRF token from response (cookies are set automatically by server)
                  const loginData = result.data as any;
                  if (loginData?.csrfToken) {
                    localStorage.setItem('csrf-token', loginData.csrfToken);
                  }

                  // Redirect to dashboard
                  router.push('/dashboard');
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Network error';
                  setError(`Failed to connect: ${errorMessage}. Make sure the backend is running.`);
                  console.error(err);
                  setLoading(false);
                }
              }, 100);
            }}
            className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign in with Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
