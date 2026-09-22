import './globals.css';
import { Toaster } from 'sonner';
import { Chivo, Cormorant_Garamond, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import Providers from '@/components/Providers';
import { getSiteUrl } from '@/lib/seo/site-url';
import { ogImageMeta } from '@/lib/seo/share-image';

const chivo = Chivo({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-heading',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const ALLI_BOOTSTRAP =
  'data:text/javascript;base64,LyogQWxsaSBBSSB3aWRnZXQgZm9yIHd3dy5jeWJlcnNlbnRyeTM2MC5jb20gKi8KKGZ1bmN0aW9uICh3LGQscyxvLGYsanMsZmpzKSB7d1snQWxsaUpTV2lkZ2V0J109bzt3W29dID0gd1tvXSB8fCBmdW5jdGlvbiAoKSB7ICh3W29dLnEgPSB3W29dLnEgfHwgW10pLnB1c2goYXJndW1lbnRzKSB9O2pzID0gZC5jcmVhdGVFbGVtZW50KHMpLCBmanMgPSBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKHMpWzBdO2pzLmlkID0gbzsganMuc3JjID0gZjsganMuYXN5bmMgPSAxOyBmanMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoanMsIGZqcyk7fSh3aW5kb3csIGRvY3VtZW50LCAnc2NyaXB0JywgJ2FsbGknLCAnaHR0cHM6Ly9zdGF0aWMuYWxsaWFpLmNvbS93aWRnZXQvdjEuanMnKSk7YWxsaSgnaW5pdCcsICdzaXRlX3o5dEFZdFR2a0FiRjhkMWsnKTthbGxpKCdvcHRpbWl6ZScsICdhbGwnKTs=';

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'cybersentry360 - AI & Cybersecurity Editorial',
    template: '%s | cybersentry360',
  },
  description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
  applicationName: 'cybersentry360',
  keywords: ['cybersecurity', 'AI security', 'threat intelligence', 'enterprise security', 'cybersentry360'],
  authors: [{ name: 'cybersentry360 Editorial' }],
  creator: 'cybersentry360',
  publisher: 'cybersentry360',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'cybersentry360',
    title: 'cybersentry360 - AI & Cybersecurity Editorial',
    description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
    url: getSiteUrl(),
    images: [ogImageMeta(null, 'cybersentry360')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cybersentry360',
    description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
    images: [ogImageMeta(null, 'cybersentry360').url],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: 'googlee92e0cf8261b500f',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://www.cybersentry360.com/feed.xml',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${chivo.variable} ${cormorant.variable} ${ibmPlex.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="cybersentry360 RSS"
          href="https://www.cybersentry360.com/feed.xml"
        />
      </head>
      <body className={ibmPlex.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { border: '2px solid #0A0A0A', borderRadius: 0, fontFamily: 'var(--font-mono), monospace' },
            }}
          />
        </Providers>
        <Script src={ALLI_BOOTSTRAP} strategy="lazyOnload" />
      </body>
    </html>
  );
}
