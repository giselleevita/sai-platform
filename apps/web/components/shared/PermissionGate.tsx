'use client';

export function PermissionGate(props: {
  allowed: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  reason?: string;
}) {
  if (props.allowed) return <>{props.children}</>;

  if (props.fallback) return <>{props.fallback}</>;

  return (
    <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
      {props.reason || 'Read-only role'}
    </span>
  );
}
