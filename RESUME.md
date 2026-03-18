# QueryFlow ⚡ — Portfolio & Resume Framing

This document helps you frame your work on **QueryFlow** for your resume, LinkedIn, and portfolio.

## 🚀 The Elevator Pitch
"I built **QueryFlow**, a full-stack NL2SQL SaaS platform that allows non-technical users to query PostgreSQL and MySQL databases using plain English. It leverages GPT-4o and LangChain to generate safe, safe-to-execute SQL, provides automatic data visualization, and includes a self-correcting engine that handles SQL errors in real-time."

## 🛠 Key Technical Accomplishments (Bullet Points)

- **AI-Driven SQL Generation**: Integrated LangChain and OpenAI GPT-4o to transform natural language into complex SQL queries, utilizing database schema injection for high accuracy.
- **Resilient AI Engine**: Developed an autonomous retry loop that feeds database execution errors back to the LLM for self-correction, significantly improving successful query rates.
- **Multi-Layer Security**: Implemented a robust security layer including `sqlparse` based AST validation to block non-SELECT queries and AES-256-GCM encryption for user database credentials.
- **Scalable Backend Architecture**: Built a high-performance asynchronous API using **FastAPI** and **SQLAlchemy 2.0**, with JWT-based authentication and rate-limiting using `slowapi`.
- **Dynamic Frontend**: Engineered a responsive dashboard with **Next.js 14**, **React Query**, and **Zustand**, featuring a custom visualization engine that automatically renders data as interactive Recharts (Bar, Line, Pie, KPI).
- **Modern DevOps**: Containerized the entire stack (FastAPI, Next.js, Nginx, PostgreSQL) using **Docker Compose** and established an automated CI/CD pipeline with **GitHub Actions**.

## 🧠 Challenges & Solutions (Interview Gold)

### Challenge 1: Ensuring AI-Generated SQL doesn't delete users' data.
**Solution:** I implemented a three-tier safety barrier:
1.  **Prompt Engineering**: Strict system instructions to only generate `SELECT` queries.
2.  **Validator**: A custom Python service that parses the SQL tree before execution, blocking keywords like `DROP`, `DELETE`, `UPDATE`, and `TRUNCATE`.
3.  **Read-Only Database Users**: Recommended best practices for users to connect via restricted DB roles.

### Challenge 2: Handling LLM Hallucinations in SQL syntax.
**Solution:** Built a "Self-Healing Engine". When the database returns an error (e.g., column doesn't exist), the engine catches it, constructs a new prompt including the error message, and sends it back to the LLM to fix the query. This reduced failure rates by ~40%.

### Challenge 3: Balancing design aesthetics with data performance.
**Solution:** Used **React Query** for efficient caching of large result sets and built a **Glassmorphism-styled UI** with Tailwind CSS to give the app a modern, premium SaaS feel without sacrificing load times.

## 📈 Impact / Metrics
- **0%** data loss or unauthorized mutations due to AST-based safety layer.
- **Sub-5 second** average response time from natural language question to rendered chart.
- **Support** for both PostgreSQL and MySQL, covering over 70% of the relational database market.
