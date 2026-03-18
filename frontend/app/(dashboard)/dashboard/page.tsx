'use client';
import React, { useState, useRef } from 'react';
import { useConnections } from '@/hooks/useConnections';
import { queryApi } from '@/lib/api';
import type { QueryResponse, LoadingStep } from '@/types';
import { formatMs } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { ResultsPanel } from '@/components/query/ResultsPanel';
import { QueryStatusBar } from '@/components/query/QueryStatusBar';

const SqlPreviewPanel = dynamic(() => import('@/components/query/SqlPreviewPanel'), { ssr: false });

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
  { key: 'executing', label: 'Running on database...' },
  { key: 'rendering', label: 'Rendering results...' },
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
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep('validating');
      await new Promise((r) => setTimeout(r, 300));
      setLoadingStep('executing');

      const { data } = await queryApi.ask(selectedConn, question.trim());

      setLoadingStep('rendering');
      await new Promise((r) => setTimeout(r, 200));
      setQueryResult(data);
      setLoadingStep('done');
    } catch (err: any) {
      const errorData = err.response?.data?.detail;
      const errorMessage = typeof errorData === 'object' ? errorData.error : errorData;
      const explanation = typeof errorData === 'object' ? errorData.explanation : null;
      
      setError(errorMessage || 'Query failed. Please try again.');
      setAiExplanation(explanation);
      setLoadingStep('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Query Your Data</h1>
        <p className="text-slate-400">Ask a question in plain English — get SQL and charts instantly.</p>
      </div>

      {/* Connection Selector */}
      <div className="glass rounded-xl p-4 mb-4 flex items-center gap-4">
        <span className="text-slate-400 text-sm font-medium whitespace-nowrap">🔗 Database:</span>
        {connLoading ? (
          <div className="shimmer h-9 w-48 rounded-lg" />
        ) : connections && connections.length > 0 ? (
          <select
            id="connection-select"
            value={selectedConn}
            onChange={(e) => setSelectedConn(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="">Select a database connection...</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.db_type === 'postgresql' ? '🐘' : '🐬'} {c.display_name} ({c.database_name})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">No connections yet.</span>
            <a href="/connections/new" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
              + Add Connection
            </a>
          </div>
        )}
      </div>

      {/* Question Input */}
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data... e.g., Show top 5 customers by revenue in 2024"
            rows={3}
            className="w-full px-6 py-5 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none text-base leading-relaxed"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-6 pb-4">
            <span className="text-slate-600 text-xs">Press Ctrl+Enter to run</span>
            <button
              id="run-query-btn"
              onClick={handleAsk}
              disabled={isLoading || !question.trim() || !selectedConn}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow hover:shadow-glow-lg active:scale-95"
            >
              {isLoading ? '⏳ Running...' : '▶ Run Query'}
            </button>
          </div>
        </div>
      </div>

      {/* Example prompts */}
      {!queryResult && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLE_QUESTIONS.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuestion(ex)}
              className="px-3 py-1.5 rounded-full glass text-slate-400 hover:text-white hover:border-brand-500/40 text-xs transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Loading steps */}
      {isLoading && <QueryStatusBar currentStep={loadingStep} steps={STEPS} />}

      {/* Error */}
      {error && (
        <div className="glass rounded-xl px-5 py-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2 font-medium">
            <span>❌ {error}</span>
          </div>
          {aiExplanation && (
            <div className="mt-3 p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-slate-200">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">AI Insight</p>
              <p className="italic leading-relaxed">"{aiExplanation}"</p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {queryResult && (
        <div className="animate-fade-in space-y-4">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {queryResult.was_corrected && (
              <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-full">
                ⚠️ Auto-corrected
              </span>
            )}
            <span>⏱ {formatMs(queryResult.execution_time_ms)}</span>
            <span>📋 {queryResult.result.row_count} rows</span>
            <span className="capitalize">📊 {queryResult.visualization.chart_type}</span>
          </div>

          {/* SQL Preview */}
          <SqlPreviewPanel sql={queryResult.generated_sql} queryId={queryResult.query_id} />

          {/* Results Panel */}
          <ResultsPanel result={queryResult.result} visualization={queryResult.visualization} />
        </div>
      )}
    </div>
  );
}
