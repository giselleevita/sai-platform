'use client';

export function Modal(props: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center px-4 py-6 text-center sm:items-center sm:p-0">
        <button
          type="button"
          aria-label="Close modal"
          className="fixed inset-0 bg-gray-900/40 transition-opacity"
          onClick={props.onClose}
        />
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg border border-gray-200 bg-white text-left shadow-xl transition-all dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{props.title}</h2>
                {props.description ? (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{props.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={props.onClose}
                className="rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
          <div className="px-5 py-5">{props.children}</div>
          {props.footer ? (
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950">
              {props.footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
