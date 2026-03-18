'use client';
import type { LoadingStep } from '@/types';
import { cn } from '@/lib/utils';

interface Step { key: LoadingStep; label: string; }

export function QueryStatusBar({ currentStep, steps }: { currentStep: LoadingStep; steps: Step[] }) {
  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="glass rounded-xl p-5 mb-4 animate-fade-in">
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className={cn('flex items-center gap-3 text-sm transition-all duration-300', done ? 'opacity-60' : active ? 'opacity-100' : 'opacity-30')}>
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                done  ? 'bg-green-500/20 text-green-400' :
                active ? 'bg-brand-500/20 text-brand-400 step-pulse' :
                         'bg-surface-border text-slate-600')}>
                {done ? '✓' : active ? '◎' : '○'}
              </div>
              <span className={done ? 'text-green-400' : active ? 'text-brand-300' : 'text-slate-500'}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
