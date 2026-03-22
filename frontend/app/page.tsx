import Link from 'next/link';

const FEATURES = [
  {
    icon: '🔗',
    title: 'Connect Any Database',
    desc: 'PostgreSQL or MySQL — connect securely in seconds. Credentials encrypted with AES-256.',
  },
  {
    icon: '💬',
    title: 'Ask in Plain English',
    desc: 'Type your question naturally. QueryFlow generates valid, safe SQL using Gemini 2.0 Flash.',
  },
  {
    icon: '📊',
    title: 'Auto Charts & Tables',
    desc: 'Results rendered as bar charts, line charts, KPI cards, or paginated tables — automatically.',
  },
  {
    icon: '🔒',
    title: 'Safety First',
    desc: 'Only SELECT queries allowed. Multi-layer SQL validation blocks harmful operations.',
  },
  {
    icon: '🔄',
    title: 'Auto-Retry on Failure',
    desc: 'If the SQL fails, QueryFlow feeds the error back to the LLM and self-corrects.',
  },
  {
    icon: '📜',
    title: 'Query History',
    desc: 'Every query is saved. Re-run, save, or share any past query with one click.',
  },
];

const EXAMPLES = [
  'Show top 10 customers by total revenue this year',
  'How many users signed up last week who are still active?',
  'Which products have the highest return rate?',
  'Monthly sales trend for Q1 vs Q2',
  'Which suppliers have more than 3 late deliveries this month?',
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold gradient-text">QueryFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute top-64 left-1/4 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-64 right-1/4 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-sm font-medium mb-6">
            <span className="status-dot success" />
            Powered by Gemini 2.0 Flash & LangChain
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Ask your data in{' '}
            <span className="gradient-text">plain English</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect your PostgreSQL or MySQL database. Type a question. Get SQL, live results,
            and beautiful charts — in under 5 seconds. No SQL knowledge required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-bold text-lg transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
            >
              Start for Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl glass text-slate-300 hover:text-white font-semibold text-lg transition-all duration-200 hover:border-brand-500/50"
            >
              Sign in to Dashboard
            </Link>
          </div>

          {/* Demo Input */}
          <div className="glass rounded-2xl p-6 text-left max-w-2xl mx-auto shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-slate-500 text-xs">QueryFlow Dashboard</span>
            </div>
            <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 mb-3 border border-surface-border">
              <span className="text-2xl">💬</span>
              <span className="text-slate-300 text-sm">Show top 5 customers by total spending in 2024</span>
              <span className="ml-auto px-3 py-1.5 bg-brand-500 rounded-lg text-white text-xs font-semibold">Run Query</span>
            </div>
            <div className="space-y-2">
              {['✅ Generating SQL...', '✅ Validating query...', '✅ Running on database...', '✅ Rendering results...'].map((step) => (
                <div key={step} className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface rounded-lg border border-green-800/40">
              <div className="sql-text text-green-400 text-xs">
                SELECT c.name, SUM(o.total_amount) AS total_spending
                FROM customers c JOIN orders o ON c.id = o.customer_id
                WHERE EXTRACT(YEAR FROM o.order_date) = 2024
                GROUP BY c.name ORDER BY total_spending DESC LIMIT 5;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Prompts */}
      <section className="py-16 px-6 border-y border-surface-border bg-surface-card/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-500 text-sm mb-6">Try questions like these →</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {EXAMPLES.map((ex) => (
              <span key={ex} className="px-4 py-2 glass rounded-full text-slate-300 text-sm hover:border-brand-500/50 hover:text-white transition-all cursor-pointer">
                {ex}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything you need, <span className="gradient-text">nothing you don't</span>
          </h2>
          <p className="text-center text-slate-400 mb-16">Built for analysts, founders, and operations teams who need data fast.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:border-brand-500/40 transition-all duration-300 hover:shadow-glow group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-300 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-violet-600/10 pointer-events-none" />
            <h2 className="relative text-4xl font-bold mb-4">Ready to query smarter?</h2>
            <p className="relative text-slate-400 mb-8">Connect your database in 60 seconds. No credit card required.</p>
            <Link
              href="/register"
              className="relative inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-bold text-lg transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>⚡</span>
          <span className="font-semibold gradient-text">QueryFlow</span>
        </div>
        <p>Natural Language to SQL · Built with FastAPI, LangChain, Next.js, and Gemini.</p>
      </footer>
    </main>
  );
}
