'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateConnection } from '@/hooks/useConnections';
import type { ConnectionCreateRequest } from '@/types';
import Link from 'next/link';

export default function NewConnectionPage() {
  const router = useRouter();
  const createConn = useCreateConnection();
  const [form, setForm] = useState<ConnectionCreateRequest>({
    display_name: '',
    db_type: 'postgresql',
    host: '',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    ssl_mode: 'prefer',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createConn.mutateAsync(form);
      router.push('/connections');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Failed to connect. Check your credentials and try again.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <Link href="/connections" className="text-slate-400 hover:text-white text-sm">← Back to Connections</Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add New Connection</h1>
        <p className="text-slate-400">Connect to your PostgreSQL or MySQL database securely.</p>
      </div>

      <div className="glass rounded-2xl p-8 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
              <input type="text" required value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} placeholder="e.g. Production Read Replica" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Database Type</label>
              <select value={form.db_type} onChange={e => setForm({...form, db_type: e.target.value, port: e.target.value === 'postgresql' ? 5432 : 3306})} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none appearance-none">
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">SSL Mode</label>
              <select value={form.ssl_mode} onChange={e => setForm({...form, ssl_mode: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none appearance-none">
                <option value="disable">Disable</option>
                <option value="prefer">Prefer</option>
                <option value="require">Require</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Host</label>
              <input type="text" required value={form.host} onChange={e => setForm({...form, host: e.target.value})} placeholder="db.example.com" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Port</label>
              <input type="number" required value={form.port} onChange={e => setForm({...form, port: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Database Name</label>
              <input type="text" required value={form.database_name} onChange={e => setForm({...form, database_name: e.target.value})} placeholder="public" className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input type="text" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-border text-white focus:border-brand-500 outline-none" />
            </div>
          </div>

          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-brand-300 text-sm">
            <strong>Security Note:</strong> We recommend creating a dedicated database user with <strong>READ-ONLY</strong> access for QueryFlow. Your credentials will be encrypted using AES-256 before storage.
          </div>

          {error && <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm">{error}</div>}

          <button type="submit" disabled={createConn.isPending} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-bold transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-50">
            {createConn.isPending ? 'Testing & Saving...' : 'Connect Database'}
          </button>
        </form>
      </div>
    </div>
  );
}
