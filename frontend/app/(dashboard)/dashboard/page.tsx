'use client';
import { QueryStatusBar } from '@/components/query/QueryStatusBar';
import { ResultsPanel } from '@/components/query/ResultsPanel';
import { useConnections } from '@/hooks/useConnections';
import { queryApi, uploadApi } from '@/lib/api';
import { formatMs } from '@/lib/utils';
import type { LoadingStep, QueryResponse } from '@/types';
import dynamic from 'next/dynamic';
import React, { useRef, useState } from 'react';

const SqlPreviewPanel = dynamic(
  () => import('@/components/query/SqlPreviewPanel'),
  { ssr: false },
);

const EXAMPLE_QUESTIONS = [
  'Show top 10 customers by total revenue',
  'How many orders were placed last month?',
  'What is the average order value by category?',
  'Show monthly revenue trend for this year',
  'Which products have never been ordered?',
];

const STEPS: { key: LoadingStep; label: string }[] = [
  { key: 'generating', label: 'Generating SQL from your question...' },
  { key: 'validating', label: 'Validating query safety...' },
  { key: 'executing',  label: 'Running on your database...' },
  { key: 'rendering',  label: 'Rendering results...' },
];

export default function DashboardPage() {
  const { data: connections, isLoading: connLoading } = useConnections();
  const [selectedConn, setSelectedConn] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ limit: 100, offset: 0 });
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = loadingStep !== 'idle' && loadingStep !== 'done';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const { data } = await uploadApi.uploadFile(file);
      // Data contains { connection_id, display_name, ... }
      setSelectedConn(data.connection_id);
      setQuestion(`Show data from ${data.table_name}`);
      // Add virtual connection to local state if needed, but for now we'll just set it as active
    } catch (err: any) {
      setError('Failed to upload file. Please try a different CSV or Excel file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAsk = async (newLimit?: number, newOffset?: number) => {
    if (!question.trim() || !selectedConn) return;
    
    // Determine the actual limit and offset to use for this request
    // If both are provided, we are paginating; otherwise, we are starting a new query
    const isPaginating = newLimit !== undefined || newOffset !== undefined;
    const limit = isPaginating ? (newLimit ?? pagination.limit) : 100;
    const offset = isPaginating ? (newOffset ?? 0) : 0;
    
    // Update pagination state
    setPagination({ limit, offset });

    setError(null);
    setAiExplanation(null);
    if (offset === 0) setQueryResult(null); // Only clear results on new query or first page
    setLoadingStep('generating');

    try {
      setLoadingStep('validating');
      setLoadingStep('executing');

      const { data } = await queryApi.ask(
        selectedConn, 
        question.trim(), 
        limit, 
        offset
      );

      setLoadingStep('rendering');
      setQueryResult(data);
      setLoadingStep('done');
    } catch (err: any) {
      const errorData = err.response?.data?.detail;
      const errorMessage =
        typeof errorData === 'object' ? errorData.error : errorData;
      const explanation =
        typeof errorData === 'object' ? errorData.explanation : null;
      setError(errorMessage || 'Query failed. Please try again.');
      setAiExplanation(explanation);
      setLoadingStep('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk();
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
          Query Your Data
        </h1>
        <p className="text-slate-400 text-sm">
          Ask a question in plain English — get SQL and charts instantly using
          Gemini AI.
        </p>
      </div>

      <div className="glass rounded-xl p-4 mb-4 flex items-center gap-3">
        <label htmlFor="connection-select" className="text-slate-400 text-sm font-medium whitespace-nowrap flex items-center gap-1.5">
          <span aria-hidden="true">🔗</span>
          <span>Data Source:</span>
        </label>

        {connLoading ? (
          <div className="shimmer h-9 flex-1 rounded-lg" />
        ) : (
          <div className="flex-1 flex gap-3">
            <select
              id="connection-select"
              value={selectedConn}
              onChange={(e) => setSelectedConn(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="">Select a connection or upload a file…</option>
              {connections && connections.length > 0 && connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.db_type === 'postgresql' ? '🐘' : '🐬'} {c.display_name}
                </option>
              ))}
              {selectedConn && !connections?.find(c => c.id === selectedConn) && (
                <option value={selectedConn}>📁 Active File Upload</option>
              )}
            </select>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="file-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-surface-hover border border-surface-border text-slate-300 text-sm hover:text-white hover:border-brand-500/50 transition-all flex items-center gap-2"
            >
              {uploading ? (
                <span className="step-pulse">⏳</span>
              ) : (
                <span aria-hidden="true">📁</span>
              )}
              <span>Upload CSV/Excel</span>
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden mb-4 hover-glow" aria-busy={isLoading}>
        <label htmlFor="question-input" className="sr-only">Ask a question</label>
        <textarea
          ref={textareaRef}
          id="question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your data… e.g., Show top 5 customers by revenue in 2024"
          rows={3}
          className="w-full px-6 pt-5 pb-2 bg-transparent text-white placeholder-slate-600 resize-none focus:outline-none text-base leading-relaxed"
          disabled={isLoading}
          aria-describedby="question-help"
        />
        <div className="flex items-center justify-between px-6 pb-4 pt-1">
          <span id="question-help" className="text-slate-600 text-xs">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-surface-hover rounded text-slate-500 text-xs font-mono">
              Ctrl+Enter
            </kbd>{' '}
            to run
          </span>
          <button
            id="run-query-btn"
            type="button"
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim() || !selectedConn}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="step-pulse" aria-hidden="true">⏳</span> Running…
              </span>
            ) : (
              '▶ Run Query'
            )}
          </button>
        </div>
      </div>

      {!queryResult && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLE_QUESTIONS.map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => setQuestion(ex)}
              className="px-3 py-1.5 rounded-full glass text-slate-400 hover:text-white hover:border-brand-500/40 text-xs transition-all"
              aria-label={`Use example question: ${ex}`}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <QueryStatusBar currentStep={loadingStep} steps={STEPS} />
      )}

      {error && (
        <div className="glass rounded-xl px-5 py-4 border border-red-500/30 bg-red-500/5 mb-4 animate-fade-in" role="alert">
          <div className="flex items-start gap-2 text-red-400 text-sm font-medium mb-1">
            <span className="flex-shrink-0" aria-hidden="true">❌</span>
            <span>{error}</span>
          </div>
          {aiExplanation && (
            <div className="mt-3 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">
                AI Insight
              </p>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                &quot;{aiExplanation}&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {queryResult && (
        <div className="animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {queryResult.was_corrected && (
              <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-full">
                <span aria-hidden="true">⚠️</span> Auto-corrected
              </span>
            )}
            <span className="px-2 py-1 bg-surface-card rounded-full">
              <span aria-hidden="true">⏱</span> {formatMs(queryResult.execution_time_ms)}
            </span>
            <span className="px-2 py-1 bg-surface-card rounded-full">
              <span aria-hidden="true">📋</span> {queryResult.result.total} rows total
            </span>
            <span className="px-2 py-1 bg-surface-card rounded-full capitalize">
              <span aria-hidden="true">📊</span> {queryResult.visualization.chart_type}
            </span>
          </div>

          <SqlPreviewPanel
            sql={queryResult.generated_sql}
            query_id={queryResult.query_id}
          />

          <ResultsPanel
            result={queryResult.result}
            visualization={queryResult.visualization}
            onPageChange={(newOffset) => handleAsk(pagination.limit, newOffset)}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
