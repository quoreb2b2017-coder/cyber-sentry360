'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  DEFAULT_DOWNLOAD_FIELDS,
  SITE_NAME,
  UPLOAD_CATEGORIES,
  VERTICALS,
  defaultFormConfig,
  verticalLabel,
} from '@/lib/resources';

const EMPTY = {
  title: '',
  description: '',
  offeredBy: SITE_NAME,
  author: '',
  category: 'whitepaper',
  vertical: 'ai',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
  overview: '',
  insideSections: [{ heading: '', body: '' }],
  explicitEmptyFields: false,
  fields: DEFAULT_DOWNLOAD_FIELDS.map((f) => ({ ...f })),
  emailNote: defaultFormConfig().consent.emailNote,
  checks: defaultFormConfig().consent.checks.map((c) => ({ ...c })),
  extra: [],
  footerLine: defaultFormConfig().consent.footerLine,
  showEmailNote: true,
  showChecks: true,
  showFooter: true,
  questions: [],
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="overline text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = 'w-full border-2 border-foreground bg-background px-3 py-2 text-sm';

function CheckLinkRow({ check, onChange, onRemove }) {
  const putBraces = () => {
    const text = check.text || '';
    if (text.includes('{')) {
      onChange({ ...check, href: check.href || '/privacy' });
      return;
    }
    const next = text.trim() ? `${text} {}` : 'I agree to the {link text}.';
    onChange({ ...check, text: next, href: check.href || '/privacy' });
  };

  return (
    <div className="space-y-1 border-2 border-foreground p-2 bg-background">
      <input className={inputClass} value={check.text || ''} placeholder="I agree to the {link text}." onChange={(e) => onChange({ ...check, text: e.target.value })} />
      <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={putBraces}>Put {'{ }'}</button>
      <input className={inputClass} value={check.href || ''} placeholder="URL for the words inside { }" onChange={(e) => onChange({ ...check, href: e.target.value })} />
      <label className="text-xs flex gap-3">
        {onRemove ? null : (
          <span className="inline-flex items-center gap-1">
            <input type="checkbox" checked={check.visible !== false} onChange={(e) => onChange({ ...check, visible: e.target.checked })} /> Show
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <input type="checkbox" checked={!!check.required} onChange={(e) => onChange({ ...check, required: e.target.checked })} /> Required
        </span>
        {onRemove ? (
          <button type="button" className="underline" onClick={onRemove}>Remove</button>
        ) : null}
      </label>
    </div>
  );
}

export default function AdminWhitePapersPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [pdf, setPdf] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);
  const [error, setError] = useState('');
  const [seoNote, setSeoNote] = useState('');
  const [setup, setSetup] = useState('');

  const load = () => {
    api.get('/admin/resources')
      .then((r) => {
        setItems(r.data.items || []);
        setSetup('');
      })
      .catch((err) => {
        setItems([]);
        setSetup(err?.response?.data?.detail || 'Run migration 008_resources.sql in Supabase.');
      });
  };

  useEffect(() => { load(); }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, fields: DEFAULT_DOWNLOAD_FIELDS.map((f) => ({ ...f })), checks: defaultFormConfig().consent.checks.map((c) => ({ ...c })), extra: [], questions: [], insideSections: [{ heading: '', body: '' }] });
    setPdf(null);
    setCover(null);
    setError('');
    setSeoNote('');
    setOpen(true);
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This removes the file and the row from the database.`)) return;
    setError('');
    try {
      await api.delete(`/admin/resources/${item.id}`);
      if (editing?.id === item.id) setOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Delete failed');
    }
  };

  const openEdit = async (id) => {
    setError('');
    const { data } = await api.get(`/admin/resources/${id}`);
    const item = data.item;
    const cfg = item.form_config || {};
    const consent = cfg.consent || {};
    setEditing(item);
    setForm({
      ...EMPTY,
      title: item.title || '',
      description: item.description || '',
      offeredBy: item.offered_by || SITE_NAME,
      author: item.author || '',
      category: item.category,
      vertical: item.vertical,
      slug: item.slug || '',
      metaTitle: item.meta_title || '',
      metaDescription: item.meta_description || '',
      keywords: (item.keywords || []).join(', '),
      overview: item.overview || '',
      insideSections: item.inside_sections?.length ? item.inside_sections : [{ heading: '', body: '' }],
      explicitEmptyFields: !!cfg.explicitEmptyFields && !(Array.isArray(cfg.fields) && cfg.fields.length),
      fields: Array.isArray(cfg.fields) && cfg.fields.length
        ? cfg.fields
        : cfg.explicitEmptyFields
          ? []
          : DEFAULT_DOWNLOAD_FIELDS.map((f) => ({ ...f })),
      emailNote: consent.emailNote || EMPTY.emailNote,
      checks: consent.checks?.length ? consent.checks : EMPTY.checks,
      extra: consent.extra || [],
      footerLine: consent.footerLine || EMPTY.footerLine,
      showEmailNote: consent.showEmailNote !== false,
      showChecks: consent.showChecks !== false,
      showFooter: consent.showFooter !== false,
      questions: (cfg.questions || []).map((q) => ({ question: q.question, optionsText: (q.options || []).join('\n') })),
    });
    setPdf(null);
    setCover(null);
    setOpen(true);
  };

  const generateSeo = async () => {
    setSeoBusy(true);
    setError('');
    setSeoNote('');
    try {
      const { data } = await api.post('/admin/resources/seo', {
        title: form.title,
        description: form.description,
        category: form.category,
        vertical: form.vertical,
      });
      setForm((f) => ({
        ...f,
        description: data.description || f.description,
        slug: data.slug || f.slug,
        metaTitle: data.metaTitle || f.metaTitle,
        metaDescription: data.metaDescription || f.metaDescription,
        keywords: data.keywords || f.keywords,
        overview: data.overview || f.overview,
        insideSections: data.insideSections?.length ? data.insideSections : f.insideSections,
      }));
      setSeoNote('Claude filled the SEO fields. You can still edit any of them before save.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Claude SEO generate failed');
    } finally {
      setSeoBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.set('title', form.title);
      body.set('description', form.description);
      body.set('offeredBy', form.offeredBy);
      body.set('author', form.author);
      body.set('category', form.category);
      body.set('vertical', form.vertical);
      body.set('slug', form.slug);
      body.set('metaTitle', form.metaTitle);
      body.set('metaDescription', form.metaDescription);
      body.set('keywords', form.keywords);
      body.set('overview', form.overview);
      body.set('insideSections', JSON.stringify(form.insideSections.filter((s) => s.heading || s.body)));
      const filledFields = form.fields.filter((f) => f.label && f.key);
      const emptyFields = !!form.explicitEmptyFields && filledFields.length === 0;
      body.set('formConfig', JSON.stringify({
        explicitEmptyFields: emptyFields,
        fields: emptyFields ? [] : filledFields,
        consent: {
          emailNote: form.emailNote,
          checks: form.checks.slice(0, 3),
          extra: form.extra.slice(0, 8),
          footerLine: form.footerLine,
          showEmailNote: form.showEmailNote,
          showChecks: form.showChecks,
          showFooter: form.showFooter,
        },
        questions: form.questions.filter((q) => q.question).map((q) => ({
          question: q.question,
          options: String(q.optionsText || '').split('\n').map((o) => o.trim()).filter(Boolean),
        })),
      }));
      if (pdf) body.set('pdf', pdf);
      if (cover) body.set('cover', cover);
      if (editing) await api.patch(`/admin/resources/${editing.id}`, body);
      else await api.post('/admin/resources', body);
      setOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl" data-testid="admin-white-papers">
      <div className="border-b-2 border-foreground pb-6 mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="overline text-primary">Resources</div>
          <h1 className="font-heading font-black uppercase text-4xl tracking-tighter">White Papers</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">Upload a PDF and choose White paper, Report, Case study, or Webinar. The public section follows that category.</p>
        </div>
        <button type="button" className="brutal-btn-primary text-[10px]" onClick={openNew}>New upload</button>
      </div>

      {setup ? (
        <div className="brutal-border bg-muted p-4 mb-6 text-sm">
          <p className="font-heading font-bold uppercase mb-1">Setup required</p>
          <p>{setup}</p>
          <p className="mt-2 font-mono text-xs">Run frontend-next/supabase/migrations/008_resources.sql in the Supabase SQL editor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mb-8" data-testid="resource-share-counts">
          <div className="brutal-border bg-foreground text-background p-4 min-w-0 overflow-hidden">
            <div className="font-mono text-[10px] uppercase tracking-widest text-background/70 leading-tight">Total shared</div>
            <div className="mt-2 font-heading font-black text-4xl tracking-tighter leading-none">{items.length}</div>
          </div>
          {VERTICALS.map((vertical) => {
            const count = items.filter((item) => item.vertical === vertical.slug).length;
            return (
              <div key={vertical.slug} className={`brutal-border bg-card p-4 min-w-0 overflow-hidden ${count ? 'shadow-brutal-sm' : ''}`}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground leading-tight break-words">{vertical.label}</div>
                <div className={`mt-2 font-heading font-black text-4xl tracking-tighter leading-none ${count ? 'text-primary' : ''}`}>{count}</div>
              </div>
            );
          })}
        </div>
      )}

      {error && !open ? <p className="mb-4 text-sm text-primary">{error}</p> : null}

      <div className="brutal-border bg-card divide-y-2 divide-foreground">
        {items.length === 0 ? <p className="p-6 font-mono text-sm text-muted-foreground">No uploads yet.</p> : items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-heading font-bold truncate">{item.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {item.category} · {verticalLabel(item.vertical)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => openEdit(item.id)}>Edit</button>
              <button type="button" className="brutal-btn text-[10px] px-3 py-2 text-primary" onClick={() => removeItem(item)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] flex justify-end bg-foreground/40">
          <form onSubmit={save} className="bg-background w-full max-w-xl h-full overflow-y-auto border-l-2 border-foreground p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black uppercase text-2xl">{editing ? 'Edit' : 'Upload'}</h2>
              <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => setOpen(false)}>Close</button>
            </div>

            <section className="brutal-border p-4 space-y-3 bg-muted">
              <h3 className="font-heading font-bold uppercase text-sm">Public download form</h3>
              <p className="text-xs text-foreground/70">This is what visitors fill in before Download Now.</p>
              {form.fields.map((field, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Label" value={field.label} onChange={(e) => {
                    const fields = [...form.fields]; fields[i] = { ...field, label: e.target.value }; set('fields', fields);
                  }} />
                  <input className={inputClass} placeholder="key" value={field.key} onChange={(e) => {
                    const fields = [...form.fields]; fields[i] = { ...field, key: e.target.value }; set('fields', fields);
                  }} />
                  <select className={inputClass} value={field.type} onChange={(e) => {
                    const fields = [...form.fields]; fields[i] = { ...field, type: e.target.value }; set('fields', fields);
                  }}>
                    <option value="text">text</option>
                    <option value="tel">tel</option>
                    <option value="email">email</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!field.required} onChange={(e) => {
                      const fields = [...form.fields]; fields[i] = { ...field, required: e.target.checked }; set('fields', fields);
                    }} /> Required
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => set('fields', [...form.fields, { label: '', key: '', type: 'text', required: false }])}>Add section</button>
                <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => { set('fields', []); set('explicitEmptyFields', true); }}>Save empty field list</button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.explicitEmptyFields && form.fields.length === 0} onChange={(e) => { set('explicitEmptyFields', e.target.checked); if (e.target.checked) set('fields', []); }} />
                Explicitly saved an empty list (no Zip/Phone fallback)
              </label>

              <Field label="Email note">
                <textarea className={inputClass} rows={2} value={form.emailNote} onChange={(e) => set('emailNote', e.target.value)} />
              </Field>
              <p className="text-xs text-foreground/70">
                Click “Put {'{ }'}” then type the red words inside the braces. Example: I agree to the {'{Privacy Policy}'}.
              </p>
              {form.checks.map((check, i) => (
                <CheckLinkRow
                  key={i}
                  check={check}
                  onChange={(next) => {
                    const checks = [...form.checks];
                    checks[i] = next;
                    set('checks', checks);
                  }}
                />
              ))}
              <Field label="Footer line">
                <input className={inputClass} value={form.footerLine} onChange={(e) => set('footerLine', e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-3 text-xs">
                <label className="inline-flex items-center gap-1"><input type="checkbox" checked={form.showEmailNote} onChange={(e) => set('showEmailNote', e.target.checked)} /> Email note</label>
                <label className="inline-flex items-center gap-1"><input type="checkbox" checked={form.showChecks} onChange={(e) => set('showChecks', e.target.checked)} /> Checkboxes</label>
                <label className="inline-flex items-center gap-1"><input type="checkbox" checked={form.showFooter} onChange={(e) => set('showFooter', e.target.checked)} /> Footer</label>
              </div>
              {form.extra.map((check, i) => (
                <CheckLinkRow
                  key={i}
                  check={check}
                  onChange={(next) => {
                    const extra = [...form.extra];
                    extra[i] = next;
                    set('extra', extra);
                  }}
                  onRemove={() => set('extra', form.extra.filter((_, n) => n !== i))}
                />
              ))}
              <button type="button" className="brutal-btn text-[10px] px-3 py-2" disabled={form.extra.length >= 8} onClick={() => set('extra', [...form.extra, { text: 'I agree to the {link text}.', href: '/privacy', required: false }])}>Add checkbox</button>

              {form.questions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <input className={inputClass} placeholder="Question" value={q.question} onChange={(e) => {
                    const questions = [...form.questions]; questions[i] = { ...q, question: e.target.value }; set('questions', questions);
                  }} />
                  <textarea className={inputClass} rows={3} placeholder="One option per line. Two or more become a dropdown." value={q.optionsText} onChange={(e) => {
                    const questions = [...form.questions]; questions[i] = { ...q, optionsText: e.target.value }; set('questions', questions);
                  }} />
                </div>
              ))}
              <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => set('questions', [...form.questions, { question: '', optionsText: '' }])}>Add question</button>
            </section>

            <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Short description"><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Offered by"><input className={inputClass} value={form.offeredBy} onChange={(e) => set('offeredBy', e.target.value)} /></Field>
            <Field label="Author"><input className={inputClass} value={form.author} onChange={(e) => set('author', e.target.value)} /></Field>
            <Field label="Category">
              <select required className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {UPLOAD_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Vertical">
              <select required className={inputClass} value={form.vertical} onChange={(e) => set('vertical', e.target.value)}>
                {VERTICALS.map((v) => <option key={v.slug} value={v.slug}>{v.label}</option>)}
              </select>
            </Field>
            <Field label={editing ? 'Replace PDF' : 'PDF file'}>
              <input type="file" accept="application/pdf" required={!editing} onChange={(e) => setPdf(e.target.files?.[0] || null)} />
            </Field>
            <Field label="Cover image">
              <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
            </Field>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold uppercase text-sm">SEO</h3>
                  <p className="text-xs text-muted-foreground">Type these by hand, or fill them with Claude. Either way you can edit before save.</p>
                </div>
                <button type="button" className="brutal-btn-primary text-[10px] px-3 py-2 shrink-0 shadow-brutal-sm" onClick={generateSeo} disabled={seoBusy || busy || !form.title}>
                  {seoBusy ? 'Claude…' : 'Generate with Claude'}
                </button>
              </div>
              {seoNote ? <p className="text-xs text-foreground/80">{seoNote}</p> : null}
              <Field label="Slug"><input className={inputClass} value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Meta title"><input className={inputClass} value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} /></Field>
              <Field label="Meta description"><textarea className={inputClass} rows={2} value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} /></Field>
              <Field label="Keywords"><input className={inputClass} value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="comma separated" /></Field>
              <Field label="Overview"><textarea className={inputClass} rows={4} value={form.overview} onChange={(e) => set('overview', e.target.value)} /></Field>
              {form.insideSections.map((section, i) => (
                <div key={i} className="space-y-1">
                  <input className={inputClass} placeholder="Inside heading" value={section.heading || ''} onChange={(e) => {
                    const insideSections = [...form.insideSections]; insideSections[i] = { ...section, heading: e.target.value }; set('insideSections', insideSections);
                  }} />
                  <textarea className={inputClass} rows={2} placeholder="Inside section" value={section.body || ''} onChange={(e) => {
                    const insideSections = [...form.insideSections]; insideSections[i] = { ...section, body: e.target.value }; set('insideSections', insideSections);
                  }} />
                </div>
              ))}
              <button type="button" className="brutal-btn text-[10px] px-3 py-2" onClick={() => set('insideSections', [...form.insideSections, { heading: '', body: '' }])}>Add inside section</button>
            </section>

            {error ? <p className="text-sm text-primary">{error}</p> : null}
            <button type="submit" disabled={busy} className="brutal-btn-primary w-full text-[10px]">{busy ? 'Saving…' : 'Save and publish'}</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
