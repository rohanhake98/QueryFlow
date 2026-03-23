'use client';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
  const setAuthState = useAuthStore((s) => s.setAuthState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const envEnabled = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === '1';
    const localEnabled = localStorage.getItem('dev_bypass') === '1';
    if (!envEnabled && !localEnabled) return;
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@queryflow.local',
      full_name: 'Demo User',
      is_verified: true,
      avatar_url: null,
    };
    localStorage.setItem('access_token', 'demo-token');
    setAuthState(demoUser, 'demo-token');
  }, [setAuthState]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
