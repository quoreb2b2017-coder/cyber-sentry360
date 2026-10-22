'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

const STORAGE_KEY = 'cybersentry360_newsletter_email';
const STATUS_KEY = 'cybersentry360_newsletter_email_status';

function sourceFromPath(pathname) {
  const article = String(pathname || '').match(/^\/article\/([^/?#]+)/);
  if (article) return { sourceType: 'blog', sourceSlug: decodeURIComponent(article[1]) };
  const resource = String(pathname || '').match(/^\/resources\/([^/]+)\/([^/?#]+)/);
  if (resource) {
    const types = {
      whitepapers: 'whitepaper',
      reports: 'report',
      'case-studies': 'case_study',
      guides: 'guide',
      webinars: 'webinar',
    };
    return { sourceType: types[resource[1]] || 'whitepaper', sourceSlug: decodeURIComponent(resource[2]) };
  }
  if (String(pathname || '').startsWith('/blog')) return { sourceType: 'blog', sourceSlug: '' };
  return { sourceType: 'site', sourceSlug: '' };
}

export function NewsletterSubscribe({
  variant = 'sidebar',
  testid = 'newsletter',
}) {
  const pathname = usePathname();
  const source = useMemo(() => sourceFromPath(pathname), [pathname]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem(STORAGE_KEY);
    const cached = localStorage.getItem(STATUS_KEY);

    if (saved) {
      setEmail(saved);
      if (cached === 'subscribed') setSubscribed(true);
    }

    // Trust local cache — only revalidate in background if status unknown
    if (!saved || cached === 'subscribed' || cached === 'off') return undefined;

    api
      .get('/newsletter/subscribe', { params: { email: saved } })
      .then((r) => {
        if (cancelled) return;
        const on = !!r.data.subscribed;
        setSubscribed(on);
        localStorage.setItem(STATUS_KEY, on ? 'subscribed' : 'off');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      await api.post('/newsletter/subscribe', {
        email,
        sourceType: source.sourceType,
        sourceSlug: source.sourceSlug,
      });
      const normalized = email.toLowerCase().trim();
      localStorage.setItem(STORAGE_KEY, normalized);
      localStorage.setItem(STATUS_KEY, 'subscribed');
      setSubscribed(true);
      setEmail('');
      toast.success("You're in. Weekly brief hits Tuesday.");
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Subscription failed';
      if (err?.response?.status === 409) {
        setNotice(detail);
        return;
      }
      toast.error(detail);
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async (e) => {
    e.preventDefault();
    const target = email.trim() || localStorage.getItem(STORAGE_KEY);
    if (!target) return toast.error('Email required');
    setBusy(true);
    try {
      await api.post('/newsletter/unsubscribe', { email: target });
      localStorage.setItem(STATUS_KEY, 'off');
      setSubscribed(false);
      toast.success('Unsubscribed. You can rejoin anytime.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unsubscribe failed');
    } finally {
      setBusy(false);
    }
  };

  const noticeLine = notice ? (
    <p className="text-xs text-primary" data-testid={`${testid}-notice`}>{notice}</p>
  ) : null;

  if (variant === 'footer') {
    return (
      <div className="w-full min-w-0 space-y-2">
        <form onSubmit={subscribe} className="space-y-2" data-testid={`${testid}-form`}>
          <div className="flex w-full min-w-0 max-w-full overflow-hidden border-2 border-background">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setNotice(''); }}
              placeholder="you@company.com"
              className="flex-1 min-w-0 max-w-full px-3 py-2.5 bg-transparent text-background placeholder:text-background/45 font-mono text-xs focus:outline-none border-r-2 border-background"
              data-testid={`${testid}-email`}
            />
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-3 sm:px-4 hover:bg-primary/90 cursor-pointer disabled:opacity-60"
              data-testid={`${testid}-submit`}
            >
              {busy ? '…' : 'Join'}
            </button>
          </div>
        </form>
        {noticeLine}
        {subscribed ? (
          <button type="button" disabled={busy} onClick={unsubscribe} className="font-mono text-[10px] uppercase tracking-widest underline">
            Unsubscribe
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="brutal-border bg-card w-full min-w-0 max-w-full overflow-x-hidden" data-testid={`${testid}-box`}>
      <div className="border-b-2 border-foreground px-3 py-2 bg-muted">
        <div className="inline-flex items-center gap-1.5 font-heading text-sm font-black uppercase tracking-wide text-primary">
          <Mail className="w-4 h-4 shrink-0" />
          {subscribed ? 'Subscribed' : 'Subscribe now'}
        </div>
      </div>
      <div className="p-3 space-y-2.5 min-w-0 overflow-x-hidden">
        <p className="font-heading text-[15px] font-black leading-snug text-foreground">
          One Tuesday brief. Zero fluff. For CISOs &amp; builders.
        </p>
        <form onSubmit={subscribe} className="space-y-2 w-full min-w-0 max-w-full overflow-x-hidden">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setNotice(''); }}
            placeholder="you@company.com"
            className="block w-full min-w-0 max-w-full box-border border-2 border-foreground px-2.5 py-2 font-mono text-xs bg-background focus:outline-none focus:ring-0"
            data-testid={`${testid}-email`}
          />
          <button
            type="submit"
            disabled={busy}
            className="brutal-btn-primary w-full max-w-full py-2 text-[10px]"
            data-testid={`${testid}-submit`}
          >
            {busy ? 'Joining…' : 'Subscribe now →'}
          </button>
        </form>
        {noticeLine}
        {subscribed ? (
          <button type="button" disabled={busy} onClick={unsubscribe} className="font-mono text-[9px] uppercase tracking-wider underline" data-testid={`${testid}-unsubscribe`}>
            Unsubscribe
          </button>
        ) : null}
      </div>
    </div>
  );
}
