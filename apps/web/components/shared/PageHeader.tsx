'use client';

export function PageHeader(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{props.title}</h1>
            {props.subtitle && <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">{props.subtitle}</p>}
          </div>
          {props.right ? <div className="flex items-center gap-2">{props.right}</div> : null}
        </div>
      </div>
    </div>
  );
}

