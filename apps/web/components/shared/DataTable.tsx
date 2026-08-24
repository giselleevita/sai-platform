'use client';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
};

export function DataTable<T extends { id: string }>(props: {
  columns: DataTableColumn<T>[];
  rows: T[];
  empty?: React.ReactNode;
}) {
  if (props.rows.length === 0 && props.empty) return <>{props.empty}</>;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              {props.columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    'px-4 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  ].join(' ')}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {props.rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-950">
                {props.columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      'px-4 py-3 align-top text-gray-700 dark:text-gray-200',
                      column.align === 'right' ? 'text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
