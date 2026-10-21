'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { leadSourceLabel, readLeadSource } from '@/lib/lead-source';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

export default function AdminNewsletterPage() {
  const [items, setItems] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/newsletter'), api.get('/admin/downloads')])
      .then(([subscribers, leads]) => {
        setItems(subscribers.data.items || []);
        setDownloads(leads.data.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const scroll = () => {
      if (window.location.hash === '#downloads') document.getElementById('downloads')?.scrollIntoView();
    };
    const timer = window.setTimeout(scroll, 50);
    window.addEventListener('hashchange', scroll);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scroll);
    };
  }, [loading]);

  const active = items.filter((i) => i.status !== 'unsubscribed');
  const optedOut = items.length - active.length;

  const csv = () => {
    const rows = [
      ['email', 'status', 'subscribed_at', 'unsubscribed_at'],
      ...items.map((i) => [i.email, i.status || 'subscribed', i.subscribed_at, i.unsubscribed_at || '']),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cybersentry360-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.email} permanently?`)) return;
    const key = s.id || s.email;
    setDeleting(key);
    try {
      await api.delete('/admin/newsletter', {
        params: s.id ? { id: s.id } : { email: s.email },
      });
      setItems((list) => list.filter((i) => (i.id ? i.id !== s.id : i.email !== s.email)));
      toast.success('Subscriber deleted from the database');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const removeDownload = async (row) => {
    if (!confirm(`Delete ${row.email} from downloads? This removes the database row.`)) return;
    setDeleting(row.id);
    try {
      await api.delete('/admin/downloads', { params: { id: row.id } });
      setDownloads((list) => list.filter((item) => item.id !== row.id));
      toast.success('Download deleted from the database');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const zipOf = (fields) => {
    const row = Object.entries(fields || {}).find(([key]) => key.toLowerCase() === 'zip');
    return row ? String(row[1]) : '—';
  };
  const phoneOf = (fields) => {
    const row = Object.entries(fields || {}).find(([key]) => key.toLowerCase() === 'phone');
    return row ? String(row[1]) : '—';
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-newsletter-page">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="overline text-primary">Audience</div>
          <h1 id="subscribes" className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter scroll-mt-6">Subscribes</h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {active.length} subscribed · {optedOut} opt out · {downloads.length} downloads
          </p>
        </div>
        <button onClick={csv} disabled={!items.length} className="brutal-btn-primary" data-testid="newsletter-export">
          Export CSV
        </button>
      </div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scroll → to read the full email and paper</p>
      <div className="brutal-border bg-card overflow-auto max-h-[420px]" tabIndex={0} aria-label="Subscribes, scroll to read each row">
        <div className="min-w-[880px]">
          <div className="sticky top-0 z-10 border-b-2 border-foreground p-3 grid grid-cols-[240px_1fr_120px_120px_110px] font-mono text-[10px] uppercase tracking-widest bg-muted gap-3">
            <span>Email</span>
            <span>Against</span>
            <span>Status</span>
            <span>Date</span>
            <span className="text-right">Action</span>
          </div>
          {loading ? (
            <p className="p-6 font-mono text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="p-6 font-mono text-sm text-muted-foreground">No subscribers yet.</p>
          ) : (
            items.map((s, i) => {
              const key = s.id || s.email;
              const busy = deleting === key;
              return (
                <div
                  key={key}
                  className={`grid grid-cols-[240px_1fr_120px_120px_110px] p-3 font-mono text-xs items-start gap-3 ${i < items.length - 1 ? 'border-b border-muted' : ''}`}
                  data-testid={`sub-${i}`}
                >
                  <span className="break-all">{s.email}</span>
                  <span className="break-words text-muted-foreground">{leadSourceLabel(readLeadSource(s)) || '—'}</span>
                  <span className={`uppercase ${s.status === 'unsubscribed' ? 'text-muted-foreground' : 'text-primary'}`}>
                    {s.status === 'unsubscribed' ? 'Opt out' : 'Subscribed'}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(s.unsubscribed_at || s.subscribed_at).toLocaleDateString()}
                  </span>
                  <span className="flex justify-end">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(s)}
                      className="brutal-btn text-[9px] px-2 py-1.5 gap-1 hover:bg-primary hover:text-primary-foreground"
                      data-testid={`sub-delete-${i}`}
                      title="Delete subscriber"
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div id="downloads" className="mt-10 scroll-mt-6">
        <h2 className="font-heading font-black uppercase text-2xl tracking-tighter mb-3">White paper downloads</h2>
        <p className="mb-2 text-sm text-muted-foreground">Who downloaded which white paper. Scroll inside the table to read the full paper, zip, and phone.</p>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scroll →</p>
        <div className="brutal-border bg-card overflow-auto max-h-[420px]" tabIndex={0} aria-label="White paper downloads, scroll to read each row">
          <div className="min-w-[1040px]">
            <div className="sticky top-0 z-10 border-b-2 border-foreground p-3 grid grid-cols-[240px_1fr_120px_160px_110px] font-mono text-[10px] uppercase tracking-widest bg-muted gap-3">
              <span>Email</span>
              <span>White paper</span>
              <span>Zip</span>
              <span>Phone</span>
              <span className="text-right">Action</span>
            </div>
            {loading ? (
              <p className="p-6 font-mono text-sm text-muted-foreground">Loading…</p>
            ) : downloads.length === 0 ? (
              <p className="p-6 font-mono text-sm text-muted-foreground">No downloads yet.</p>
            ) : (
              downloads.map((row) => (
                <div key={row.id} className="grid grid-cols-[240px_1fr_120px_160px_110px] p-3 font-mono text-xs items-start gap-3 border-b border-muted last:border-b-0">
                  <span className="break-all">{row.email}</span>
                  <span className="break-words">{row.resource_title}</span>
                  <span className="break-all">{zipOf(row.fields)}</span>
                  <span className="break-all">{phoneOf(row.fields)}</span>
                  <span className="flex justify-end">
                    <button
                      type="button"
                      disabled={deleting === row.id}
                      onClick={() => removeDownload(row)}
                      className="brutal-btn text-[9px] px-2 py-1.5 gap-1 hover:bg-primary hover:text-primary-foreground"
                    >
                      {deleting === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Delete
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
