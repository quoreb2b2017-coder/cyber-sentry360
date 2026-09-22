'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings2, X } from 'lucide-react';
import {
  OPEN_PREFS_EVENT,
  getConsent,
  hasConsentDecision,
  saveConsent,
} from '@/lib/consent';

function Toggle({ id, label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-2 border-foreground p-4 bg-card">
      <div className="min-w-0 pr-2">
        <label htmlFor={id} className="font-heading font-bold uppercase text-sm tracking-tight block">
          {label}
        </label>
        <p className="mt-1 text-sm text-foreground/80 leading-snug">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative shrink-0 w-12 h-7 border-2 border-foreground transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed bg-muted' : 'cursor-pointer'
        } ${checked && !disabled ? 'bg-primary' : 'bg-background'}`}
        data-testid={`consent-toggle-${id}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 border-2 border-foreground bg-background transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getConsent();
    if (existing) {
      setAnalytics(!!existing.analytics);
      setMarketing(!!existing.marketing);
      setVisible(false);
    } else {
      setVisible(true);
    }

    const openPrefs = () => {
      const current = getConsent();
      setAnalytics(!!current?.analytics);
      setMarketing(!!current?.marketing);
      setPanelOpen(true);
      setVisible(true);
    };

    window.addEventListener(OPEN_PREFS_EVENT, openPrefs);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, openPrefs);
  }, []);

  const persist = useCallback((nextAnalytics, nextMarketing, choice) => {
    saveConsent({ analytics: nextAnalytics, marketing: nextMarketing, choice });
    setAnalytics(nextAnalytics);
    setMarketing(nextMarketing);
    setPanelOpen(false);
    setVisible(false);
  }, []);

  if (!mounted || (!visible && !panelOpen)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-5 pointer-events-none" data-testid="cookie-consent-root">
      <div
        className="pointer-events-auto max-w-[1100px] mx-auto brutal-border bg-card shadow-brutal"
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
      >
        <div className="border-b-2 border-foreground bg-foreground text-background px-4 py-3 sm:px-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="overline text-primary text-[9px] mb-0.5">Privacy</div>
            <h2 id="cookie-consent-title" className="font-heading font-black uppercase text-lg sm:text-xl tracking-tighter leading-none">
              Cookie preferences
            </h2>
          </div>
          {(panelOpen || hasConsentDecision()) && (
            <button
              type="button"
              className="text-background/70 hover:text-primary transition-colors"
              aria-label="Close cookie preferences"
              onClick={() => {
                setPanelOpen(false);
                if (hasConsentDecision()) setVisible(false);
              }}
              data-testid="cookie-consent-close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {!panelOpen ? (
            <>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed max-w-3xl">
                We use strictly necessary cookies to run cybersentry360, plus optional analytics and marketing
                cookies. You can accept all, reject non-essential, or choose categories.{' '}
                <Link href="/privacy#cookies" className="text-primary underline underline-offset-2 hover:opacity-80">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <button
                  type="button"
                  className="brutal-btn-primary text-[10px] px-4 py-3"
                  onClick={() => persist(true, true, 'accept_all')}
                  data-testid="cookie-accept-all"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="brutal-btn text-[10px] px-4 py-3"
                  onClick={() => persist(false, false, 'reject_all')}
                  data-testid="cookie-reject-all"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  className="brutal-btn text-[10px] px-4 py-3 inline-flex items-center gap-2"
                  onClick={() => setPanelOpen(true)}
                  data-testid="cookie-customize"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Customize
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Strictly necessary cookies stay on. Toggle optional categories, then save.
              </p>
              <div className="space-y-3">
                <Toggle
                  id="necessary"
                  label="Strictly necessary"
                  description="Security, consent storage, and basic site navigation. Always on."
                  checked
                  disabled
                  onChange={() => {}}
                />
                <Toggle
                  id="analytics"
                  label="Analytics"
                  description="Anonymous page-view measurement and Google Analytics (Consent Mode) when allowed."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <Toggle
                  id="marketing"
                  label="Marketing / attribution"
                  description="First-touch UTM and landing-path attribution for campaign measurement."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="brutal-btn-primary text-[10px] px-4 py-3"
                  onClick={() => persist(analytics, marketing, 'custom')}
                  data-testid="cookie-save-prefs"
                >
                  Save preferences
                </button>
                <button
                  type="button"
                  className="brutal-btn text-[10px] px-4 py-3"
                  onClick={() => persist(true, true, 'accept_all')}
                  data-testid="cookie-accept-all-panel"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="brutal-btn text-[10px] px-4 py-3"
                  onClick={() => persist(false, false, 'reject_all')}
                  data-testid="cookie-reject-panel"
                >
                  Reject non-essential
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
