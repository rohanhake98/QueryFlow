import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'QueryFlow — Ask Your Data in Plain English',
  description: 'Connect your PostgreSQL or MySQL database and ask questions in plain English. QueryFlow generates SQL, runs it, and renders beautiful charts — automatically.',
  keywords: ['NL2SQL', 'natural language SQL', 'database query', 'AI analytics', 'QueryFlow'],
  openGraph: {
    title: 'QueryFlow — Natural Language to SQL',
    description: 'Ask your database in plain English. Get SQL and charts.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
