'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const CookieConsentChrome = dynamic(() => import('@/components/CookieConsentChrome'), {
  ssr: false,
});

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 90_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CookieConsentChrome />
    </QueryClientProvider>
  );
}
