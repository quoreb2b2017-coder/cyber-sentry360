import './globals.css';
import { Toaster } from 'sonner';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'cybersentry360 - AI & Cybersecurity Editorial',
  description: 'Rigorous reporting on AI and cybersecurity for enterprise technology leaders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { border: '2px solid #0A0A0A', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
