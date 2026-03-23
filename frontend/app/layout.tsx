import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import React from 'react';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-surface text-slate-100 antialiased font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-surface-card focus:border focus:border-surface-border focus:text-white"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
