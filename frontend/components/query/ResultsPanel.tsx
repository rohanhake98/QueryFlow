'use client';
import type { QueryResult, VisualizationMeta } from '@/types';
import { BarChartView } from '@/components/charts/BarChartView';
import { LineChartView } from '@/components/charts/LineChartView';
import { PieChartView } from '@/components/charts/PieChartView';
import { KpiCard } from '@/components/charts/KpiCard';
import { DataTable } from '@/components/charts/DataTable';

interface Props { result: QueryResult; visualization: VisualizationMeta; }

export function ResultsPanel({ result, visualization }: Props) {
  const { chart_type, x_axis, y_axis, title } = visualization;

  const downloadCsv = () => {
    if (!result.rows.length) return;
    const headers = result.columns.map(c => c.name).join(',');
    const rows = result.rows.map(row => 
      result.columns.map(col => `"${String(row[col.name] || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = () => {
    if (!result.rows.length) return;
    const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().getTime()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {title || 'Query Results'} · {result.row_count} rows
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!result.rows.length}
            className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-surface-hover hover:bg-surface-border text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Download results as CSV"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={downloadJson}
            disabled={!result.rows.length}
            className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-surface-hover hover:bg-surface-border text-slate-400 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Download results as JSON"
          >
            JSON
          </button>
        </div>
      </div>
      <div className="p-4">
        {chart_type === 'kpi' && <KpiCard columns={result.columns} rows={result.rows} />}
        {chart_type === 'bar' && x_axis && y_axis && (
          <BarChartView data={result.rows} xKey={x_axis} yKey={y_axis} title={title} />
        )}
        {chart_type === 'line' && x_axis && y_axis && (
          <LineChartView data={result.rows} xKey={x_axis} yKey={y_axis} title={title} />
        )}
        {chart_type === 'pie' && x_axis && y_axis && (
          <PieChartView data={result.rows} nameKey={x_axis} valueKey={y_axis} />
        )}
        {(chart_type === 'table' || (!['kpi', 'bar', 'line', 'pie'].includes(chart_type))) && (
          <DataTable columns={result.columns} rows={result.rows} />
        )}
      </div>
    </div>
  );
}
