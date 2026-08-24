'use client';

export function FormField(props: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={props.htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {props.label}
        {props.required ? <span className="text-red-600"> *</span> : null}
      </label>
      <div className="mt-1">{props.children}</div>
      {props.hint ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{props.hint}</p> : null}
    </div>
  );
}

export const fieldClassName =
  'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100';
