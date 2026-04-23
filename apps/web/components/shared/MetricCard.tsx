'use client';

export function MetricCard(props: { title: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{props.title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{props.hint}</div> : null}
    </div>
  );
}

