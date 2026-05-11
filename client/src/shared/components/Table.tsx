import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const SortIcon = ({ columnKey, sortKey, sortDirection }: {
  columnKey: string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}) => {
  if (sortKey !== columnKey) return <ChevronsUpDown size={16} className="text-neutral-400" />;
  return sortDirection === 'asc'
    ? <ChevronUp size={16} className="text-primary" />
    : <ChevronDown size={16} className="text-primary" />;
};

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border p-8">
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border">
        <thead className="bg-neutral-100 dark:bg-dark-card">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-4 text-left text-base font-semibold text-neutral-900 dark:text-dark-text',
                  column.sortable && 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-dark-border',
                  column.className
                )}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <SortIcon
                      columnKey={column.key}
                      {...(sortKey !== undefined ? { sortKey } : {})}
                      {...(sortDirection !== undefined ? { sortDirection } : {})}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              className={cn(
                'border-t border-neutral-200 dark:border-dark-border transition-colors',
                'hover:bg-neutral-50 dark:hover:bg-dark-card',
                index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-neutral-50 dark:bg-dark-card/50'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-6 py-4 text-base text-neutral-700 dark:text-neutral-300', column.className)}
                >
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const count = Math.min(5, totalPages);
  if (totalPages <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  if (currentPage <= 3) return Array.from({ length: count }, (_, i) => i + 1);
  if (currentPage >= totalPages - 2) return Array.from({ length: count }, (_, i) => totalPages - 4 + i);
  return Array.from({ length: count }, (_, i) => currentPage - 2 + i);
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const btnBase = cn(
    'px-4 py-2 min-h-touch rounded-lg font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
  );

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border">
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(btnBase, 'border-2 border-neutral-300 dark:border-dark-border', 'hover:bg-neutral-100 dark:hover:bg-dark-card', 'disabled:opacity-50 disabled:cursor-not-allowed')}
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                btnBase,
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'border-2 border-neutral-300 dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-dark-card'
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(btnBase, 'border-2 border-neutral-300 dark:border-dark-border', 'hover:bg-neutral-100 dark:hover:bg-dark-card', 'disabled:opacity-50 disabled:cursor-not-allowed')}
        >
          Next
        </button>
      </div>
    </div>
  );
};
