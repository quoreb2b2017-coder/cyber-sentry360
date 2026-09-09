'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, X } from 'lucide-react';

const STORAGE_KEY = 'cybersentry360_newsletter_email';
const STATUS_KEY = 'cybersentry360_newsletter_email_status';

const REASONS = [
  { id: 'not_relevant', label: 'The brief no longer matches what I need to read.' },
  { id: 'deliverability', label: 'Emails are hard to open or keep landing in spam.' },
  { id: 'too_many', label: 'I am getting more messages than I need right now.' },
  { id: 'never_signed_up', label: 'I do not recall signing up for these emails.' },
  { id: 'other', label: 'Something else.' },
];

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState(REASONS[0].id);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get('email');
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
    setEmail((fromQuery || fromStorage || '').trim());
  }, [searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) {
      toast.error('Email required');
      return;
    }
    setBusy(true);
    try {
      await api.post('/newsletter/unsubscribe', {
        email: target,
        reason,
      });
      localStorage.setItem(STORAGE_KEY, target);
      localStorage.setItem(STATUS_KEY, 'off');
      setDone(true);
      toast.success('You have been unsubscribed.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unsubscribe failed');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="brutal-border bg-card p-8 md:p-10 text-center" data-testid="unsubscribe-success">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="font-heading font-black uppercase text-2xl tracking-tighter mb-2">
          You&apos;re off the list
        </h2>
        <p className="font-serif italic text-base text-muted-foreground max-w-md mx-auto mb-6">
          <span className="font-mono text-xs not-italic break-all text-foreground">{email}</span>
          {' '}will no longer receive the cybersentry360 weekly brief.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="brutal-btn-primary text-[10px] px-4 py-2">
            Back to site
          </Link>
          <Link href="/search" className="brutal-btn text-[10px] px-4 py-2">
            Browse archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="brutal-border bg-card overflow-hidden" data-testid="unsubscribe-form">
      <div className="bg-foreground text-background px-5 py-5 md:px-8 md:py-6 relative">
        <Link
          href="/"
          className="absolute top-4 right-4 text-background/70 hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Link>
        <Link href="/" className="font-heading font-black text-2xl md:text-3xl tracking-tighter inline-block">
          cybersentry<span className="text-primary">360</span>
        </Link>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-background/80">
          Unsubscribe from email updates
        </p>
      </div>

      <div className="p-5 md:p-8 space-y-6">
        <p className="text-sm md:text-base text-foreground/85 leading-relaxed max-w-xl">
          Enter the email you used to subscribe. We&apos;ll remove it from the cybersentry360 weekly brief list.
        </p>

        <label className="block">
          <span className="font-heading font-bold uppercase text-sm tracking-tight block mb-2">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full border-2 border-foreground px-4 py-3 font-mono text-sm bg-background focus:outline-none"
            data-testid="unsubscribe-email"
          />
        </label>

        <fieldset>
          <legend className="font-heading font-bold uppercase text-sm tracking-tight mb-3">
            Why are you leaving?{' '}
            <span className="font-mono text-[10px] normal-case tracking-wider text-muted-foreground">
              (optional insight)
            </span>
          </legend>
          <div className="space-y-2.5">
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={`flex items-start gap-3 border-2 px-3 py-3 cursor-pointer transition-colors ${
                  reason === r.id ? 'border-primary bg-muted' : 'border-foreground/20 hover:border-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.id}
                  checked={reason === r.id}
                  onChange={() => setReason(r.id)}
                  className="mt-1 accent-[hsl(var(--primary))]"
                />
                <span className="text-sm leading-snug">{r.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="brutal-btn-primary w-full sm:w-auto min-w-[180px] py-3.5 text-[11px]"
          data-testid="unsubscribe-submit"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background" data-testid="unsubscribe-page">
      <div className="max-w-xl mx-auto px-5 py-10 md:py-16">
        <Suspense
          fallback={
            <div className="brutal-border bg-card p-10 font-mono text-sm text-center">Loading…</div>
          }
        >
          <UnsubscribeForm />
        </Suspense>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Changed your mind?{' '}
          <Link href="/" className="text-primary hover:underline">
            Rejoin from the homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
