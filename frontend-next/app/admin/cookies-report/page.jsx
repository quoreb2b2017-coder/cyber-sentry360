'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Cookie, Download, RefreshCw, ShieldCheck } from 'lucide-react';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

const EMPTY = {
  available: false,
  detail: '',
  metrics: { pageViews: 0, uniqueSessions: 0, consentEvents: 0, totalEvents: 0 },
  topPaths: [],
  campaigns: [],
  devices: [],
  countries: [],
  cities: [],
  timeZones: [],
  consentBreakdown: [],
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

function BreakdownList({ title, rows }) {
  return (
    <div className="brutal-border bg-card">
      <div className="border-b-2 border-foreground p-4 overline">{title}</div>
      {rows.length === 0 ? (
        <p className="p-6 font-mono text-sm text-muted-foreground">No data yet.</p>
      ) : (
        rows.map((row, i) => (
          <div
            key={`${row.key}-${i}`}
            className={`p-4 flex justify-between gap-3 ${i < rows.length - 1 ? 'border-b border-muted' : ''}`}
          >
            <span className="font-mono text-xs truncate flex-1" title={row.key}>
              {row.key}
            </span>
            <span className="font-heading font-bold shrink-0">{row.count}</span>
          </div>
        ))
      )}
    </div>
  );
}

function consentLabel(analytics, marketing) {
  if (analytics && marketing) return 'Analytics + marketing';
  if (analytics) return 'Analytics only';
  if (marketing) return 'Marketing only';
  return 'Necessary only';
}

export default function AdminCookiesReportPage() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback((nextRange = range) => {
    setLoading(true);
    api
      .get('/admin/cookies-report', { params: { range: nextRange } })
      .then((r) => setData({ ...EMPTY, ...r.data, metrics: { ...EMPTY.metrics, ...(r.data.metrics || {}) } }))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const m = data.metrics;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookies-visitors-${range}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = [
      'createdAt',
      'kind',
      'path',
      'sessionId',
      'analytics',
      'marketing',
      'pseudonymizedIp',
      'country',
      'city',
      'utmSource',
      'utmMedium',
      'utmCampaign',
    ];
    const lines = [header.join(',')];
    for (const row of data.recent || []) {
      lines.push(
        [
          row.createdAt,
          row.kind,
          `"${String(row.path || '').replace(/"/g, '""')}"`,
          row.sessionId,
          row.analytics,
          row.marketing,
          row.pseudonymizedIp || '',
          row.country || '',
          row.city || '',
          row.utmSource || '',
          row.utmMedium || '',
          row.utmCampaign || '',
        ].join(',')
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookies-visitors-recent-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl" data-testid="admin-cookies-report">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary flex items-center gap-2">
          <Cookie className="w-3 h-3" /> GDPR / visitors
        </div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">
          Cookies &amp; visitors
        </h1>
        <p className="mt-2 font-serif italic text-lg text-muted-foreground max-w-2xl">
          First-party page views, consent decisions, campaigns, and approximate geo — admin only. IPs shown are
          pseudonymized. No full emails stored.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={range === r.id ? 'brutal-btn-primary text-[10px] px-4 py-2' : 'brutal-btn text-[10px] px-4 py-2'}
              onClick={() => setRange(r.id)}
              data-testid={`cookies-range-${r.id}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" className="brutal-btn text-[10px] px-3 py-2 inline-flex items-center gap-2" onClick={() => load(range)}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button type="button" className="brutal-btn text-[10px] px-3 py-2 inline-flex items-center gap-2" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button type="button" className="brutal-btn text-[10px] px-3 py-2 inline-flex items-center gap-2" onClick={exportJson}>
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-sm">Loading…</p>
      ) : !data.available ? (
        <div className="brutal-border p-6 bg-muted space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="font-heading font-bold uppercase">Setup required</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.detail ||
              'Run migrations 006_consent_events.sql and 007_site_analytics_events.sql in the Supabase SQL Editor, then Accept/Reject on the public site to populate this report.'}
          </p>
          <Link href="/privacy#cookies" className="brutal-btn text-[10px] inline-block" target="_blank">
            View public Privacy Policy →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat label="Page views" value={m.pageViews} />
            <Stat label="Unique sessions" value={m.uniqueSessions} />
            <Stat label="Consent events" value={m.consentEvents} />
            <Stat label="Total events" value={m.totalEvents} hint={range} />
          </div>

          <div className="brutal-border bg-card mb-8">
            <div className="border-b-2 border-foreground p-4 overline">Consent breakdown</div>
            {(data.consentBreakdown || []).length === 0 ? (
              <p className="p-6 font-mono text-sm text-muted-foreground">No consent events in range.</p>
            ) : (
              (data.consentBreakdown || []).map((row, i, arr) => (
                <div
                  key={`${row.analytics}-${row.marketing}-${i}`}
                  className={`p-4 flex justify-between gap-3 ${i < arr.length - 1 ? 'border-b border-muted' : ''}`}
                >
                  <span className="font-mono text-xs uppercase">
                    {consentLabel(row.analytics, row.marketing)}
                  </span>
                  <span className="font-heading font-bold">{row.count}</span>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BreakdownList title="Top paths" rows={data.topPaths || []} />
            <BreakdownList title="UTM / campaigns" rows={data.campaigns || []} />
            <BreakdownList title="Devices" rows={data.devices || []} />
            <BreakdownList title="Countries" rows={data.countries || []} />
            <BreakdownList title="Cities" rows={data.cities || []} />
            <BreakdownList title="Time zones" rows={data.timeZones || []} />
          </div>

          <div className="brutal-border bg-card overflow-x-auto">
            <div className="border-b-2 border-foreground p-4 overline">Recent events</div>
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-muted font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Time</th>
                  <th className="p-3">Kind</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">A / M</th>
                  <th className="p-3">IP (pseudo)</th>
                  <th className="p-3">Geo</th>
                  <th className="p-3">UTM</th>
                </tr>
              </thead>
              <tbody>
                {(data.recent || []).map((row) => (
                  <tr key={row.id} className="border-b border-muted/60 align-top">
                    <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] uppercase">{row.kind}</td>
                    <td className="p-3 font-mono text-[11px] max-w-[220px] truncate" title={row.path}>
                      {row.path || '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px]">{row.sessionId || '—'}</td>
                    <td className="p-3 font-mono text-[11px]">
                      {row.analytics ? 'A' : '—'}/{row.marketing ? 'M' : '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px]">{row.pseudonymizedIp || '—'}</td>
                    <td className="p-3 font-mono text-[11px]">
                      {[row.city, row.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="p-3 font-mono text-[11px] max-w-[160px] truncate">
                      {[row.utmSource, row.utmMedium, row.utmCampaign].filter(Boolean).join(' / ') || '—'}
                    </td>
                  </tr>
                ))}
                {(data.recent || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 font-mono text-sm text-muted-foreground">
                      No events yet. Accept analytics on the public site to generate page views.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
