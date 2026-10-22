'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  DEFAULT_DOWNLOAD_FIELDS,
  DOWNLOAD_FIELD_OPTIONS,
  SITE_NAME,
  UPLOAD_CATEGORIES,
  VERTICALS,
  defaultFormConfig,
  verticalLabel,
} from '@/lib/resources';

const CONSENT = defaultFormConfig().consent;

function blankForm() {
  return {
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
    fields: DEFAULT_DOWNLOAD_FIELDS.map((f) => ({ ...f })),
    emailNote: CONSENT.emailNote,
    terms: { ...CONSENT.terms },
    partners: { ...CONSENT.partners },
    optOut: { ...CONSENT.optOut },
    extra: [],
    footerLine: CONSENT.footerLine,
    questions: [],
    seoMode: 'manual',
  };
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="overline text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = 'w-full border-2 border-foreground bg-background px-3 py-2 text-sm';

function VerticalSelect({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [openList, setOpenList] = useState(false);
  const selected = VERTICALS.find((v) => v.slug === value);
  const q = query.trim().toLowerCase();
  const options = VERTICALS.filter((v) => !q || v.label.toLowerCase().includes(q));
  return (
    <div className="relative">
      <input
        className={inputClass}
        value={openList ? query : (selected?.label || '')}
        placeholder="Search verticals"
        onFocus={() => { setOpenList(true); setQuery(''); }}
        onChange={(e) => { setQuery(e.target.value); setOpenList(true); }}
        onBlur={() => setTimeout(() => setOpenList(false), 150)}
        aria-label="Vertical"
      />
      {openList ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto border-2 border-foreground bg-background">
          {options.map((v) => (
            <li key={v.slug}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => { onChange(v.slug); setQuery(''); setOpenList(false); }}
              >
                {v.label}
              </button>
            </li>
          ))}
          {options.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">No matching vertical</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

export default function AdminWhitePapersPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
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
    setForm(blankForm());
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
    const modern = consent.terms || consent.partners || consent.optOut;
    const category = UPLOAD_CATEGORIES.some((c) => c.slug === item.category) ? item.category : 'whitepaper';
    setEditing(item);
    setForm({
      ...blankForm(),
      title: item.title || '',
      description: String(item.description || '').slice(0, 220),
      offeredBy: item.offered_by || SITE_NAME,
      author: item.author || '',
      category,
      vertical: item.vertical,
      slug: item.slug || '',
      metaTitle: item.meta_title || '',
      metaDescription: item.meta_description || '',
      keywords: (item.keywords || []).join(', '),
      overview: item.overview || '',
      insideSections: item.inside_sections?.length ? item.inside_sections : [{ heading: '', body: '' }],
      fields: Array.isArray(cfg.fields)
        ? cfg.fields
        : DEFAULT_DOWNLOAD_FIELDS.map((f) => ({ ...f })),
      emailNote: modern ? (consent.emailNote ?? CONSENT.emailNote) : CONSENT.emailNote,
      terms: modern ? { ...CONSENT.terms, ...consent.terms } : { ...CONSENT.terms },
      partners: modern ? { ...CONSENT.partners, ...consent.partners } : { ...CONSENT.partners },
      optOut: modern ? { ...CONSENT.optOut, ...consent.optOut } : { ...CONSENT.optOut },
      extra: modern ? (consent.extra || []) : [],
      footerLine: modern ? (consent.footerLine ?? CONSENT.footerLine) : CONSENT.footerLine,
      questions: (cfg.questions || []).slice(0, 20).map((q) => ({
        question: q.question || '',
        options: Array.isArray(q.options) && q.options.length ? q.options.map((option) => String(option)) : [''],
      })),
      seoMode: 'manual',
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
      if (!form.description.trim()) throw new Error('Description is required');
      if (form.description.trim().length > 220) throw new Error('Description must be 220 characters or fewer');
      if (!pdf && !editing) throw new Error('PDF file is required');
      if (!cover && !(editing && editing.cover_url)) throw new Error('Thumbnail is required');
      body.set('formConfig', JSON.stringify({
        fields: form.fields.filter((f) => f.key).slice(0, 12),
        consent: {
          emailNote: form.emailNote,
          terms: { ...form.terms, required: true },
          partners: { ...form.partners, required: true },
          optOut: { ...form.optOut, required: false },
          extra: form.extra.slice(0, 8),
          footerLine: form.footerLine,
        },
        questions: form.questions.filter((q) => q.question.trim()).slice(0, 20).map((q) => ({
          question: q.question.trim(),
          options: (q.options || []).map((option) => String(option).trim()).filter(Boolean).slice(0, 20),
        })),
      }));
      if (pdf) body.set('pdf', pdf);
      if (cover) body.set('cover', cover);
      if (editing) await api.patch(`/admin/resources/${editing.id}`, body);
      else await api.post('/admin/resources', body);
      setOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Save failed');
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

            <section className="space-y-4 border-2 border-[#F58220] bg-[#FFF6EE] p-4">
              <div>
                <h3 className="font-heading font-bold uppercase text-sm text-[#0B1F3D]">Download form</h3>
                <p className="mt-1 text-xs text-[#0B1F3D]/80">These fields and checkboxes are what visitors see. Add a section or checkbox, then save.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-heading text-xs font-bold uppercase">Download form sections</h4>
                {form.fields.map((field, i) => {
                  const used = new Set(form.fields.filter((_, n) => n !== i).map((row) => row.key));
                  return (
                    <div key={`${field.key}-${i}`} className="flex items-center gap-2">
                      <select
                        className={`${inputClass} min-w-0 flex-1`}
                        value={field.key}
                        onChange={(e) => {
                          const option = DOWNLOAD_FIELD_OPTIONS.find((row) => row.key === e.target.value);
                          if (!option) return;
                          const fields = [...form.fields];
                          fields[i] = { key: option.key, label: option.label, type: option.type, required: field.required !== false };
                          set('fields', fields);
                        }}
                      >
                        {DOWNLOAD_FIELD_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key} disabled={used.has(option.key)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex shrink-0 items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.required !== false}
                          onChange={(e) => {
                            const fields = [...form.fields];
                            fields[i] = { ...field, required: e.target.checked };
                            set('fields', fields);
                          }}
                        />
                        Required
                      </label>
                      <button type="button" className="shrink-0 text-xs underline" onClick={() => set('fields', form.fields.filter((_, n) => n !== i))}>Remove</button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="brutal-btn text-[10px] px-3 py-2"
                  disabled={form.fields.length >= 12 || form.fields.length >= DOWNLOAD_FIELD_OPTIONS.length}
                  onClick={() => {
                    const used = new Set(form.fields.map((row) => row.key));
                    const next = DOWNLOAD_FIELD_OPTIONS.find((option) => !used.has(option.key));
                    if (!next || form.fields.length >= 12) return;
                    set('fields', [...form.fields, { key: next.key, label: next.label, type: next.type, required: true }]);
                  }}
                >
                  Add section
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="font-heading text-xs font-bold uppercase">Download form consent text</h4>
                <p className="text-xs text-[#0B1F3D]/70">
                  {'{{terms}} Terms of Use, {{privacy}} Privacy Policy, {{privacy-statement}} privacy statement, {{unsubscribe}} unsubscribe, {{publisher}} '}
                  {SITE_NAME}
                  {'. **text** is bold.'}
                </p>
                <Field label="Email note">
                  <textarea className={inputClass} rows={2} value={form.emailNote} onChange={(e) => set('emailNote', e.target.value)} />
                </Field>
                {['terms', 'partners', 'optOut'].map((key) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="overline text-muted-foreground">
                        {key === 'optOut' ? 'Opt-out checkbox (optional)' : key === 'terms' ? 'Terms checkbox' : 'Partners checkbox'}
                      </span>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={form[key].visible !== false}
                          onChange={(e) => set(key, { ...form[key], visible: e.target.checked })}
                        />
                        Show
                      </label>
                    </div>
                    <textarea className={inputClass} rows={3} value={form[key].text || ''} onChange={(e) => set(key, { ...form[key], text: e.target.value })} />
                  </div>
                ))}
                <Field label="Line under Download Now">
                  <input className={inputClass} value={form.footerLine} onChange={(e) => set('footerLine', e.target.value)} />
                </Field>
                {form.extra.map((check, i) => (
                  <div key={i} className="space-y-1 border border-[#F58220]/40 bg-white p-2">
                    <textarea className={inputClass} rows={2} value={check.text || ''} onChange={(e) => {
                      const extra = [...form.extra];
                      extra[i] = { ...check, text: e.target.value };
                      set('extra', extra);
                    }} />
                    <div className="flex gap-3 text-xs">
                      {/\bopt[\s-]*out\b/i.test(check.text || '') ? (
                        <span>Optional</span>
                      ) : (
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={!!check.required} onChange={(e) => {
                            const extra = [...form.extra];
                            extra[i] = { ...check, required: e.target.checked };
                            set('extra', extra);
                          }} />
                          Required
                        </label>
                      )}
                      <button type="button" className="underline" onClick={() => set('extra', form.extra.filter((_, n) => n !== i))}>Remove</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="brutal-btn text-[10px] px-3 py-2" disabled={form.extra.length >= 8} onClick={() => set('extra', [...form.extra, { text: '', required: false }])}>Add checkbox</button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-heading text-sm font-bold">Download form questions</h4>
                  <button
                    type="button"
                    className="rounded-full border border-[#0B1F3D]/15 bg-white px-3 py-1 text-xs font-semibold text-[#0B1F3D] disabled:opacity-40"
                    disabled={form.questions.length >= 20}
                    onClick={() => set('questions', [...form.questions, { question: '', options: [''] }])}
                  >
                    + Add
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-[#0B1F3D]/70">
                  Optional. Each question appears on the public download form. Add 2+ options to show a dropdown; leave options empty for a text field (max 20 questions).
                </p>
                {form.questions.map((q, i) => {
                  const filledOptions = (q.options || []).map((option) => String(option).trim()).filter(Boolean);
                  return (
                    <div key={i} className="space-y-3 rounded-xl border border-[#0B1F3D]/10 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#0B1F3D]/10 bg-[#f3f3f3] text-xs font-semibold text-[#0B1F3D]/70">{i + 1}</span>
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-[#0B1F3D]/15 bg-white px-3 py-2 text-sm"
                          placeholder="e.g. What is your fleet size?"
                          value={q.question}
                          onChange={(e) => {
                            const questions = [...form.questions];
                            questions[i] = { ...q, question: e.target.value };
                            set('questions', questions);
                          }}
                        />
                        <button type="button" className="px-1 text-lg leading-none text-[#0B1F3D]/50" aria-label="Remove question" onClick={() => set('questions', form.questions.filter((_, n) => n !== i))}>×</button>
                      </div>
                      <div className="flex items-center justify-between gap-3 pl-9">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0B1F3D]/70">Dropdown options (optional)</span>
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#2457d6] disabled:opacity-40"
                          disabled={(q.options || []).length >= 20}
                          onClick={() => {
                            const questions = [...form.questions];
                            questions[i] = { ...q, options: [...(q.options || []), ''] };
                            set('questions', questions);
                          }}
                        >
                          + Add option
                        </button>
                      </div>
                      <div className="space-y-2 pl-9">
                        {(q.options || []).map((option, n) => (
                          <div key={n} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-xs text-[#0B1F3D]/50">{n + 1}.</span>
                            <input
                              className="min-w-0 flex-1 rounded-lg border border-[#0B1F3D]/15 bg-white px-3 py-2 text-sm"
                              placeholder="e.g. 1–10 vehicles"
                              value={option}
                              onChange={(e) => {
                                const options = [...(q.options || [])];
                                options[n] = e.target.value;
                                const questions = [...form.questions];
                                questions[i] = { ...q, options };
                                set('questions', questions);
                              }}
                            />
                            <button
                              type="button"
                              className="px-1 text-lg leading-none text-[#0B1F3D]/50"
                              aria-label="Remove option"
                              onClick={() => {
                                const options = (q.options || []).filter((_, index) => index !== n);
                                const questions = [...form.questions];
                                questions[i] = { ...q, options };
                                set('questions', questions);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {filledOptions.length === 1 ? (
                          <p className="text-xs text-[#F58220]">Add one more option to enable dropdown on the public form.</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <Field label="Category">
              <select required className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {UPLOAD_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Vertical">
              <VerticalSelect value={form.vertical} onChange={(slug) => set('vertical', slug)} />
            </Field>
            <Field label={editing ? 'Replace PDF' : 'PDF'}>
              <input type="file" accept="application/pdf" required={!editing} onChange={(e) => setPdf(e.target.files?.[0] || null)} />
            </Field>
            <Field label={editing?.cover_url ? 'Replace thumbnail' : 'Thumbnail'}>
              <input type="file" accept="image/*" required={!editing?.cover_url} onChange={(e) => setCover(e.target.files?.[0] || null)} />
            </Field>

            <div className="space-y-2">
              <span className="overline text-muted-foreground">SEO mode</span>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="seoMode" checked={form.seoMode === 'claude'} onChange={() => set('seoMode', 'claude')} /> Claude
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="seoMode" checked={form.seoMode !== 'claude'} onChange={() => set('seoMode', 'manual')} /> Manual
                </label>
              </div>
            </div>

            <Field label="Title"><input required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Description">
              <textarea required maxLength={220} className={inputClass} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{form.description.length}/220</span>
            </Field>
            <Field label="Offered by"><input className={inputClass} value={form.offeredBy} onChange={(e) => set('offeredBy', e.target.value)} /></Field>
            <Field label="Author"><input className={inputClass} value={form.author} onChange={(e) => set('author', e.target.value)} /></Field>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold uppercase text-sm">SEO</h3>
                  <p className="text-xs text-muted-foreground">
                    {form.seoMode === 'claude'
                      ? 'Generate with Claude, then edit before save. Nothing is published until you save.'
                      : 'Type the SEO fields by hand. Nothing is generated on save.'}
                  </p>
                </div>
                {form.seoMode === 'claude' ? (
                  <button type="button" className="shrink-0 bg-[#F58220] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#e67410] disabled:opacity-50" onClick={generateSeo} disabled={seoBusy || busy || !form.title}>
                    {seoBusy ? 'Claude…' : 'Generate with Claude'}
                  </button>
                ) : null}
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
