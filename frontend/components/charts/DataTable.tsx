'use client';
import type { ColumnMeta } from '@/types';
import { useMemo, useState } from 'react';

const PAGE_SIZE = 20;

interface Props {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  total?: number;
  limit?: number;
  offset?: number;
  onPageChange?: (offset: number) => void;
  isLoading?: boolean;
}

export function DataTable({ columns, rows, total, limit, offset, onPageChange, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av === bv) return 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [rows, sortKey, sortDir]);

  // Use props for pagination if available, otherwise fall back to client-side (though now we expect server-side)
  const isServerSide = total !== undefined && limit !== undefined && offset !== undefined;
  
  const currentPage = isServerSide ? Math.floor(offset / limit) : 0;
  const totalPages = isServerSide ? Math.ceil(total / limit) : 1;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange && isServerSide) {
      onPageChange(newPage * limit);
    }
  };

  return (
    <div className={isLoading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
      <div className="table-container border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface">
              {columns.map((col) => {
                const isActive = sortKey === col.name;
                const ariaSort = isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                return (
                  <th
                    key={col.name}
                    scope="col"
                    aria-sort={ariaSort}
                    className="px-4 py-3 text-left text-slate-400 font-medium whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.name)}
                      className="inline-flex items-center gap-2 hover:text-white transition-colors select-none"
                      aria-label={`Sort by ${col.name.replace(/_/g, ' ')}`}
                    >
                      <span>{col.name.replace(/_/g, ' ')}</span>
                      <span aria-hidden="true">{isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {isLoading ? 'Loading results...' : 'No rows returned.'}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-surface-border/50 hover:bg-surface-hover transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className="px-4 py-3 text-slate-300 font-mono text-xs max-w-xs truncate"
                    >
                      {String(row[col.name] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>
            Page {currentPage + 1} of {totalPages} · {total} total rows
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
              className="px-3 py-1.5 rounded-lg glass hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1 || isLoading}
              className="px-3 py-1.5 rounded-lg glass hover:text-white disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
