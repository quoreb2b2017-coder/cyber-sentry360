'use client';

import { usePathname } from 'next/navigation';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';

/** Public-site consent + GA. Skips /admin routes. */
export default function CookieConsentChrome() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <GoogleAnalytics />
      <CookieConsentBanner />
    </>
  );
}
