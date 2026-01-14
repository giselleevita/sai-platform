'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/shared';
import { api } from '@/lib/api';

interface ActivityItem {
  id: string;
  type: 'tool' | 'risk' | 'incident' | 'policy' | 'control' | 'evidence';
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'approved' | 'rejected';
  targetId: string;
  targetName: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function ActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError('');
      const csrfToken = localStorage.getItem('csrf-token') || localStorage.getItem('token');
      if (!csrfToken) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const result = await api.get<ActivityItem[]>(`/api/activity?${params}`);
      if (result.success && result.data) {
        setActivities(result.data);
      } else {
        setError(result.error || 'Failed to load activity feed');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '➕';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'commented':
        return '💬';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📝';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tool':
        return '📦';
      case 'risk':
        return '⚠️';
      case 'incident':
        return '🚨';
      case 'policy':
        return '📋';
      case 'control':
        return '🛡️';
      case 'evidence':
        return '📄';
      default:
        return '📝';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
          <p className="mt-2 text-sm text-gray-600">
            Recent changes and updates across your platform
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            {['all', 'tool', 'risk', 'incident', 'policy', 'control'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No activity found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {getActionIcon(activity.action)} {getTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {activity.actor.name}
                      </span>
                      <span className="text-gray-600">
                        {activity.action} {activity.type}
                      </span>
                      <span className="font-medium text-gray-900">
                        {activity.targetName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
