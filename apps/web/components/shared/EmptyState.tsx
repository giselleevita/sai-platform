'use client';

export function EmptyState(props: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{props.title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-300">{props.message}</p>
      {props.action ? <div className="mt-5">{props.action}</div> : null}
    </div>
  );
}
