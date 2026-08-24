'use client';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClass: Record<StatusTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700',
  success: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900',
};

export function getStatusTone(value?: string): StatusTone {
  const status = (value || '').toUpperCase();
  if (['APPROVED', 'ACTIVE', 'LOW', 'REVIEWED', 'RESOLVED', 'COMPLIANT'].includes(status)) return 'success';
  if (['SUBMITTED', 'UNDER_REVIEW', 'MEDIUM', 'CLASSIFIED', 'DEFERRED', 'PENDING'].includes(status)) return 'warning';
  if (['MISSING', 'EXPIRED', 'CRITICAL', 'HIGH', 'DETECTED', 'ESCALATED', 'REJECTED', 'OVERDUE'].includes(status)) {
    return 'danger';
  }
  if (['DRAFT', 'INFO'].includes(status)) return 'info';
  return 'neutral';
}

export function StatusBadge({ value, tone }: { value?: string; tone?: StatusTone }) {
  const displayValue = value ? value.replaceAll('_', ' ') : 'Unknown';
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        toneClass[tone || getStatusTone(value)],
      ].join(' ')}
    >
      {displayValue}
    </span>
  );
}
