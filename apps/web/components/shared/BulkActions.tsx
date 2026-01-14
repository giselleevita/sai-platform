'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface BulkActionsProps {
  selectedIds: string[];
  onSuccess: () => void;
  onError: (error: string) => void;
  endpoint: 'inventory' | 'risks';
}

export function BulkActions({ selectedIds, onSuccess, onError, endpoint }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} item(s)? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.post(`/api/bulk/${endpoint}/delete`, { ids: selectedIds });
      if (result.success) {
        onSuccess();
        setShowMenu(false);
      } else {
        onError(result.error || 'Failed to delete items');
      }
    } catch (err: any) {
      onError(err?.message || 'Failed to delete items');
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Selected'}
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
