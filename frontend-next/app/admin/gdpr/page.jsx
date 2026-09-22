'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Scale, ShieldCheck } from 'lucide-react';

const EMPTY = {
  available: false,
  stats: {
    total: 0,
    acceptAll: 0,
    rejectAll: 0,
    custom: 0,
    analyticsOn: 0,
    marketingOn: 0,
    analyticsRate: 0,
    marketingRate: 0,
    acceptRate: 0,
  },
  recent: [],
};

function Stat({ label, value, hint }) {
  return (
    <div className="brutal-border p-5 bg-card">
      <div className="overline text-muted-foreground">{label}</div>
      <div className="mt-2 font-heading font-black text-4xl tracking-tighter">{value}</div>
      {hint ? <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AdminGdprPage() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/consent')
      .then((r) => setData({ ...EMPTY, ...r.data, stats: { ...EMPTY.stats, ...(r.data.stats || {}) } }))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const s = data.stats;

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-gdpr-page">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary flex items-center gap-2">
          <Scale className="w-3 h-3" /> Compliance
        </div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">GDPR</h1>
        <p className="mt-2 font-serif italic text-lg text-muted-foreground max-w-2xl">
          Consent lawfulness, category opt-ins, and privacy controls (last 30 days). Separate from the Cookies
          visitor analytics report.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/admin/cookies-report" className="brutal-btn text-[10px] px-4 py-2">
          Open Cookies report →
        </Link>
        <Link href="/privacy#cookies" className="brutal-btn text-[10px] px-4 py-2" target="_blank">
          Public Privacy Policy →
        </Link>
      </div>

      {loading ? (
        <p className="font-mono text-sm">Loading…</p>
      ) : !data.available ? (
        <div className="brutal-border p-6 bg-muted">
          <p className="font-heading font-bold uppercase mb-2">Setup required</p>
          <p className="text-sm text-muted-foreground mb-3">
            Run migration <code className="font-mono text-xs">006_consent_events.sql</code> in Supabase SQL Editor,
            then visitor Accept / Reject choices will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Stat label="Consent decisions" value={s.total} hint="30 days" />
            <Stat label="Accept all" value={s.acceptAll} hint={`${s.acceptRate}%`} />
            <Stat label="Reject non-essential" value={s.rejectAll} />
            <Stat label="Customized" value={s.custom} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Stat label="Analytics granted" value={s.analyticsOn} hint={`${s.analyticsRate}%`} />
            <Stat label="Marketing granted" value={s.marketingOn} hint={`${s.marketingRate}%`} />
            <Stat label="Necessary" value="Always on" hint="Cannot disable" />
            <Stat label="IP handling" value="Pseudo" hint="Last octet zeroed" />
          </div>

          <div className="brutal-border bg-card mb-8">
            <div className="border-b-2 border-foreground p-4 overline flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> GDPR checklist
            </div>
            <ul className="divide-y-2 divide-foreground text-sm">
              {[
                'Consent stored first-party (cybersentry360_consent) — not a third-party CMP',
                'Non-essential off until the visitor chooses',
                'Analytics / GA Consent Mode denied by default',
                'No full emails in cookies or analytics events',
                'Consent audit uses pseudonymized IP',
                'Visitor can reopen preferences anytime (footer)',
                'Analytics events retained ~180 days then deleted',
              ].map((item) => (
                <li key={item} className="px-4 py-3 flex gap-2">
                  <span className="text-primary shrink-0">■</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="brutal-border bg-card">
            <div className="border-b-2 border-foreground p-4 overline">Recent consent decisions</div>
            {data.recent?.length ? (
              data.recent.map((row, i) => (
                <div
                  key={row.id}
                  className={`p-4 flex flex-wrap items-center justify-between gap-2 ${
                    i < data.recent.length - 1 ? 'border-b border-muted' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-foreground">
                      {String(row.choice || '').replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      Analytics {row.analytics ? 'on' : 'off'} · Marketing {row.marketing ? 'on' : 'off'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-6 font-mono text-sm text-muted-foreground">
                No consent events yet. Open the public site and use Accept / Reject to generate the first row.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
