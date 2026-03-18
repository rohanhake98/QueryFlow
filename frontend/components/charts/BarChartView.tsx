'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

interface Props { data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string | null; }

export function BarChartView({ data, xKey, yKey, title }: Props) {
  return (
    <div>
      {title && <p className="text-sm text-slate-400 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9' }}
            cursor={{ fill: 'rgba(99,102,241,0.1)' }}
          />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
