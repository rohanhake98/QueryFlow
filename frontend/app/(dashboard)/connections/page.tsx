'use client';
import { useConnections, useDeleteConnection, useRefreshSchema } from '@/hooks/useConnections';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export default function ConnectionsPage() {
  const { data: connections, isLoading, error } = useConnections();
  const deleteConn = useDeleteConnection();
  const refreshSchema = useRefreshSchema();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete connection "${name}"?`)) {
      await deleteConn.mutateAsync(id);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await refreshSchema.mutateAsync(id);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Database Connections</h1>
          <p className="text-slate-400">Manage your connected databases for querying.</p>
        </div>
        <Link
          href="/connections/new"
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-medium transition-all shadow-glow hover:shadow-glow-lg"
        >
          + Add Connection
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
          Failed to load connections.
        </div>
      ) : connections?.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <div className="text-5xl mb-4" aria-hidden="true">🔗</div>
          <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
          <p className="text-slate-400 mb-6">Connect your first database to start querying.</p>
          <Link href="/connections/new" className="text-brand-400 hover:text-brand-300 font-medium">
            Add your first connection →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {connections?.map((conn) => (
            <div key={conn.id} className="glass rounded-2xl p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleRefresh(conn.id)}
                  disabled={refreshingId === conn.id}
                  className="p-2 bg-surface-hover rounded-lg hover:bg-surface-border transition-colors text-slate-300 disabled:opacity-50"
                  aria-label="Refresh schema"
                >
                  <span aria-hidden="true">{refreshingId === conn.id ? '⏳' : '🔄'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(conn.id, conn.display_name)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  aria-label={`Delete connection ${conn.display_name}`}
                >
                  <span aria-hidden="true">🗑</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl">
                  <span aria-hidden="true">{conn.db_type === 'postgresql' ? '🐘' : '🐬'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{conn.display_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="status-dot success" aria-hidden="true"></span> Active</span>
                    <span>·</span>
                    <span>{conn.db_type}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-400 mb-4 bg-surface-card p-3 rounded-xl border border-surface-border">
                <div className="flex justify-between"><span>Host:</span> <span className="text-slate-300">{conn.host}</span></div>
                <div className="flex justify-between"><span>Database:</span> <span className="text-slate-300">{conn.database_name}</span></div>
              </div>

              <div className="text-xs text-slate-500">
                Schema last cached: {conn.schema_cached_at ? formatDate(conn.schema_cached_at) : 'Never'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
