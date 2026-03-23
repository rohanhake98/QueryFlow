'use client';
import { useConnections } from '@/hooks/useConnections';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { formatDate, formatMs } from '@/lib/utils';
import type { HistoryItem } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HistoryPage() {
  const [selectedConn, setSelectedConn] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [search, setSearch] = useState('');
  
  const { data: connections } = useConnections();
  const { data: history, isLoading } = useQueryHistory(selectedConn, savedOnly);
  const router = useRouter();

  const filteredHistory = history?.items.filter(item => 
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.generated_sql.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Query History</h1>
          <p className="text-slate-400">View and rerun your past queries.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <label htmlFor="history-search" className="sr-only">Search query history</label>
          <input 
            id="history-search"
            type="text" 
            placeholder="Search queries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm outline-none w-64 focus:border-brand-500 transition-colors"
          />
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="rounded text-brand-500 bg-surface border-surface-border focus:ring-brand-500 focus:ring-offset-surface" />
            <span className="text-sm text-slate-300">Saved only</span>
          </label>
          
          <label htmlFor="history-connection" className="sr-only">Filter by connection</label>
          <select id="history-connection" value={selectedConn} onChange={(e) => setSelectedConn(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm outline-none w-48 focus:border-brand-500">
            <option value="">All Connections</option>
            {connections?.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)
        ) : filteredHistory?.length === 0 ? (
          <div className="text-center py-20 glass rounded-xl text-slate-400">
            {search ? 'No queries match your search.' : 'No history found. Go ask a question!'}
          </div>
        ) : (
          filteredHistory?.map((item: HistoryItem) => (
            <div key={item.id} className="glass rounded-xl p-5 hover:border-surface-border transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-white text-lg">
                    {item.is_saved && <span className="text-yellow-400 mr-2" aria-hidden="true">⭐</span>}
                    {item.saved_name || item.question}
                  </h3>
                  {item.saved_name && <p className="text-slate-400 text-sm mt-1">&quot;{item.question}&quot;</p>}
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')} 
                  className="px-3 py-1.5 bg-surface-hover hover:bg-surface-border text-white text-sm rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                  <span aria-hidden="true">▶</span> Open
                </button>
              </div>
              
              <div className="bg-surface-card p-3 rounded-lg border border-surface-border mb-3 max-h-24 overflow-hidden relative">
                <code className="sql-text text-brand-300">{item.generated_sql}</code>
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface-card to-transparent pointer-events-none" />
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{formatDate(item.created_at)}</span>
                {item.status === 'success' ? (
                  <>
                    <span className="text-green-400">✓ Success</span>
                    <span>{formatMs(item.execution_time_ms || 0)}</span>
                    <span>{item.row_count} rows</span>
                    {item.chart_type && <span className="capitalize">{item.chart_type} Chart</span>}
                  </>
                ) : item.status === 'blocked' ? (
                  <span className="text-yellow-500"><span aria-hidden="true">⚠</span> Blocked for safety</span>
                ) : (
                  <span className="text-red-400"><span aria-hidden="true">❌</span> Error</span>
                )}
                {item.was_corrected && <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full">Auto-corrected</span>}
              </div>
            </div>
          ))
        )}
      </div>
      
      {history && history.total > 50 && (
         <div className="text-center mt-6 text-sm text-slate-500">Showing 50 most recent queries.</div>
      )}
    </div>
  );
}
