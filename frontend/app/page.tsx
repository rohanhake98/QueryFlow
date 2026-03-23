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
    <div className="landing-root">
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Primary">
          <div className="landing-brand-wrap">
            <span className="landing-brand-icon" aria-hidden="true">⚡</span>
            <span className="landing-brand gradient-text">QueryFlow</span>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="landing-link-btn">
              Sign In
            </Link>
            <Link href="/register" className="landing-primary-btn">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-bg">
            <div className="landing-blob blob-a" />
            <div className="landing-blob blob-b" />
            <div className="landing-blob blob-c" />
          </div>

          <div className="landing-hero-inner">
            <div className="landing-chip">
              <span className="status-dot success" aria-hidden="true" />
              Built with Gemini + LangChain
            </div>
            <h1 id="hero-title" className="landing-title">
              Ask your data in <span className="gradient-text">plain English</span>
            </h1>
            <p className="landing-subtitle">
              Connect PostgreSQL or MySQL, ask a question, and get SQL with charts instantly. Fast, safe, and built for real teams.
            </p>

            <div className="landing-cta-row">
              <Link href="/register" className="landing-hero-primary">
                Start for Free
              </Link>
              <Link href="/login" className="landing-hero-secondary">
                Open Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-preview-section">
          <div className="landing-preview-card glass">
            <div className="landing-preview-head">
              <div className="landing-dots" aria-hidden="true">
                <div className="dot red" />
                <div className="dot yellow" />
                <div className="dot green" />
              </div>
              <span className="landing-preview-label">Query Preview</span>
            </div>
            <div className="landing-preview-input">
              <span className="landing-preview-emoji" aria-hidden="true">💬</span>
              <span className="landing-preview-text">Show top 5 customers by total spending in 2024</span>
              <span className="landing-preview-run">Run Query</span>
            </div>
            <div className="landing-sql">
              SELECT c.name, SUM(o.total_amount) AS total_spending FROM customers c JOIN orders o ON c.id = o.customer_id WHERE EXTRACT(YEAR FROM o.order_date) = 2024 GROUP BY c.name ORDER BY total_spending DESC LIMIT 5;
            </div>
          </div>
        </section>

        <section className="landing-examples">
          <div className="landing-container-wide">
            <p className="landing-examples-title">Try questions like these</p>
            <div className="landing-chip-grid">
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="landing-example-chip">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-features" aria-labelledby="features-title">
          <div className="landing-container-wide">
            <h2 id="features-title" className="landing-features-title">
              Everything you need, <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
            <p className="landing-features-sub">Built for analysts, founders, and operations teams who need data fast.</p>
            <div className="landing-features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="landing-feature-card glass">
                  <div className="landing-feature-icon" aria-hidden="true">{f.icon}</div>
                  <h3 className="landing-feature-name">{f.title}</h3>
                  <p className="landing-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta-section" aria-labelledby="cta-title">
          <div className="landing-cta-card glass">
            <div className="landing-cta-bg" />
            <h2 id="cta-title" className="landing-cta-title">Ready to query smarter?</h2>
            <p className="landing-cta-sub">Connect your database in under a minute. No credit card required.</p>
            <Link href="/register" className="landing-cta-btn">
              Get Started Free
            </Link>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-brand">
            <span aria-hidden="true">⚡</span>
            <span className="font-semibold gradient-text">QueryFlow</span>
          </div>
          <p>Natural Language to SQL · Built with FastAPI, LangChain, Next.js, and Gemini</p>
        </footer>
      </main>
    </div>
  );
}
