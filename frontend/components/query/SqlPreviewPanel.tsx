'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { historyApi } from '@/lib/api';

interface Props { sql: string; queryId: string; }

export default function SqlPreviewPanel({ sql, queryId }: Props) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await historyApi.save(queryId, saveName.trim());
      setShowSave(false);
      setSaveName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-brand-400 font-semibold">SQL</span>
          <span className="text-slate-600 text-xs">Generated Query</span>
        </div>
        <div className="flex items-center gap-2">
          {showSave && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Query name..."
                className="px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-brand-500"
                aria-label="Query name"
              />
              <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold transition-colors hover:bg-brand-400 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowSave(false)} className="text-slate-500 hover:text-white text-xs" aria-label="Cancel save">✕</button>
            </div>
          )}
          {!showSave && (
            <button id="save-query-btn" type="button" onClick={() => setShowSave(true)} className="px-3 py-1.5 rounded-lg bg-surface-hover text-slate-400 hover:text-white text-xs font-medium transition-colors" aria-label="Save query">
              <span aria-hidden="true">⭐</span> Save
            </button>
          )}
          <button id="copy-sql-btn" type="button" onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-surface-hover text-slate-400 hover:text-white text-xs font-medium transition-colors" aria-live="polite">
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <Editor
        height="160px"
        language="sql"
        value={sql}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          lineNumbers: 'off',
          folding: false,
          glyphMargin: false,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
