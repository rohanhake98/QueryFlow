import { performance } from 'node:perf_hooks';

type Row = Record<string, number | string>;

function createRows(count: number): Row[] {
  return Array.from({ length: count }).map((_, idx) => ({
    customer: `customer_${idx}`,
    total_spend: Math.floor(Math.random() * 100000),
  }));
}

function runBaseline(rows: Row[], iterations: number) {
  const started = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    const sorted = [...rows].sort((a, b) => Number(b.total_spend) - Number(a.total_spend));
    sorted.slice(0, 20);
  }
  return performance.now() - started;
}

function runMemoized(rows: Row[], iterations: number) {
  const started = performance.now();
  const cache = new Map<string, Row[]>();
  for (let i = 0; i < iterations; i += 1) {
    const key = 'total_spend:desc';
    if (!cache.has(key)) {
      cache.set(key, [...rows].sort((a, b) => Number(b.total_spend) - Number(a.total_spend)));
    }
    cache.get(key)!.slice(0, 20);
  }
  return performance.now() - started;
}

function printResults() {
  const rows = createRows(20000);
  const iterations = 250;

  const baseline = runBaseline(rows, iterations);
  const memoized = runMemoized(rows, iterations);
  const improvement = ((baseline - memoized) / baseline) * 100;

  process.stdout.write(`Rows: ${rows.length}\n`);
  process.stdout.write(`Iterations: ${iterations}\n`);
  process.stdout.write(`Baseline (re-sort every render): ${baseline.toFixed(2)}ms\n`);
  process.stdout.write(`Optimized (cached sort + paged slices): ${memoized.toFixed(2)}ms\n`);
  process.stdout.write(`Improvement: ${improvement.toFixed(2)}%\n`);
}

printResults();
