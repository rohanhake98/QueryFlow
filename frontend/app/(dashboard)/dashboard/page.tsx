'use client';
import { QueryStatusBar } from '@/components/query/QueryStatusBar';
import { ResultsPanel } from '@/components/query/ResultsPanel';
import { useConnections } from '@/hooks/useConnections';
import { queryApi } from '@/lib/api';
import { formatMs } from '@/lib/utils';
import type { LoadingStep, QueryResponse } from '@/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = loadingStep !== 'idle' && loadingStep !== 'done';

  const handleAsk = async () => {
    if (!question.trim() || !selectedConn) return;
    setError(null);
    setAiExplanation(null);
    setQueryResult(null);
    setLoadingStep('generating');

    try {
      setLoadingStep('validating');
      setLoadingStep('executing');

      const { data } = await queryApi.ask(selectedConn, question.trim());

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
          <span>Database:</span>
        </label>

        {connLoading ? (
          <div className="shimmer h-9 flex-1 rounded-lg" />
        ) : connections && connections.length > 0 ? (
          <select
            id="connection-select"
            value={selectedConn}
            onChange={(e) => setSelectedConn(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
          >
            <option value="">Select a database connection…</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.db_type === 'postgresql' ? '🐘' : '🐬'} {c.display_name} — {c.database_name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">No connections yet.</span>
            <Link
              href="/connections/new"
              className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
            >
              + Add Connection
            </Link>
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
            onClick={handleAsk}
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
              <span aria-hidden="true">📋</span> {queryResult.result.row_count} rows
            </span>
            <span className="px-2 py-1 bg-surface-card rounded-full capitalize">
              <span aria-hidden="true">📊</span> {queryResult.visualization.chart_type}
            </span>
          </div>

          <SqlPreviewPanel
            sql={queryResult.generated_sql}
            queryId={queryResult.query_id}
          />

          <ResultsPanel
            result={queryResult.result}
            visualization={queryResult.visualization}
          />
        </div>
      )}
    </div>
  );
}
