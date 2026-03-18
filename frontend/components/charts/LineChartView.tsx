'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string | null; }

export function LineChartView({ data, xKey, yKey, title }: Props) {
  return (
    <div>
      {title && <p className="text-sm text-slate-400 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9' }} />
          <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#8b5cf6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
