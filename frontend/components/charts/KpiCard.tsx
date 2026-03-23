'use client';
import type { ColumnMeta } from '@/types';
import { formatNumber } from '@/lib/utils';

interface Props { columns: ColumnMeta[]; rows: Record<string, unknown>[]; }

export function KpiCard({ columns, rows }: Props) {
  const col = columns[0];
  const val = rows[0]?.[col.name];
  const display = typeof val === 'number' ? formatNumber(val) : String(val ?? '—');
  const ariaLabel = `${col.name.replace(/_/g, ' ')} KPI`;

  return (
    <div className="flex items-center justify-center py-8" role="img" aria-label={ariaLabel}>
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider">{col.name.replace(/_/g, ' ')}</p>
        <p className="text-6xl font-extrabold gradient-text">{display}</p>
      </div>
    </div>
  );
}
