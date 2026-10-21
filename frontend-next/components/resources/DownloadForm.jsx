'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITE_NAME, consentParts, publicFields } from '@/lib/resources';

function isOptOutCheck(check) {
  const text = String(check?.text || '');
  return check?.required === false || /contact me|related research|marketing|opt out/i.test(text);
}

function ConsentCopy({ text, href }) {
  const parts = consentParts(text, href);
  if (!parts.length) return text;
  return parts.map((part, i) => (
    part.type === 'link' ? (
      <Link
        key={`${part.href}-${i}`}
        href={part.href}
        className="text-primary underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {part.label}
      </Link>
    ) : (
      <span key={i}>{part.value}</span>
    )
  ));
}

export default function DownloadForm({ resource }) {
  const config = resource.form_config || {};
  const fields = publicFields(config);
  const consent = config.consent || {};
  const questions = Array.isArray(config.questions) ? config.questions : [];
  const checks = [
    ...(consent.showChecks === false ? [] : (consent.checks || []).filter((c) => c.visible !== false && c.text)),
    ...(consent.extra || []).filter((c) => c.text),
  ];

  const hasMore = fields.length > 0 || questions.length > 0;
  const [email, setEmail] = useState('');
  const [values, setValues] = useState({});
  const [answers, setAnswers] = useState({});
  const [agreed, setAgreed] = useState({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Work email is required');
      return;
    }
    const missingCheck = checks.find((check) => check.required !== false && !agreed[check.text]);
    if (missingCheck) {
      setError('Tick every required consent box before download');
      return;
    }
    if (hasMore && !detailsOpen) {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(`/api/resources/${resource.slug}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            fields: values,
            answers,
            consent: agreed,
            saveOnly: true,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.saved) {
          throw new Error(data.detail || 'Could not save this download');
        }
        setLeadId(data.id || '');
        setDetailsOpen(true);
      } catch (err) {
        setError(err.message || 'Could not save this download');
      } finally {
        setBusy(false);
      }
      return;
    }
    const missingField = fields.find((field) => !String(values[field.key] || '').trim());
    if (missingField) {
      setError(`${missingField.label} is required`);
      return;
    }
    const missingQuestion = questions.find((q) => q.question && !String(answers[q.question] || '').trim());
    if (missingQuestion) {
      setError('Answer every question before download');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/resources/${resource.slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fields: values,
          answers,
          consent: agreed,
          leadId,
        }),
      });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.includes('pdf')) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Download failed');
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const name = String(resource.title || resource.slug || 'download').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'download';
      link.href = objectUrl;
      link.download = `${name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-muted border-2 border-foreground p-5 space-y-3 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto" data-testid="resource-download-form">
      <div className="overline text-primary">Download</div>
      <label className="block text-sm">
        <span className="font-heading font-bold uppercase text-xs tracking-wide">Work email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-xs"
          placeholder="you@company.com"
        />
      </label>
      {consent.showEmailNote !== false && consent.emailNote ? (
        <p className="text-xs text-foreground/75 leading-snug">{consent.emailNote}</p>
      ) : null}
      {checks.map((check) => (
        <label key={check.text} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            required={check.required !== false}
            checked={!!agreed[check.text]}
            onChange={(e) => setAgreed((v) => ({ ...v, [check.text]: e.target.checked }))}
            className="mt-1"
          />
          <span>
            {isOptOutCheck(check) ? (
              <>
                <span className="font-heading font-bold uppercase text-xs tracking-wide">Opt out</span>
                <span className="block">Tick to opt out of research emails.</span>
              </>
            ) : (
              <ConsentCopy text={check.text} href={check.href} />
            )}
          </span>
        </label>
      ))}
      {consent.showFooter !== false && consent.footerLine ? (
        <p className="text-xs text-foreground/70">{String(consent.footerLine).replaceAll('Compare Bazaar', SITE_NAME)}</p>
      ) : null}
      {detailsOpen ? (
        <div className="space-y-3 border-t-2 border-foreground pt-3" data-testid="download-extra-fields">
          {fields.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="font-heading font-bold uppercase text-xs tracking-wide">{field.label}</span>
              <input
                type={field.type || 'text'}
                required
                value={values[field.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-xs"
              />
            </label>
          ))}
          {questions.map((q) => (
            <label key={q.question} className="block text-sm">
              <span className="font-heading font-bold uppercase text-xs tracking-wide">{q.question}</span>
              {Array.isArray(q.options) && q.options.length >= 2 ? (
                <select
                  required
                  className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-xs"
                  value={answers[q.question] || ''}
                  onChange={(e) => setAnswers((v) => ({ ...v, [q.question]: e.target.value }))}
                >
                  <option value="">Select</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  className="mt-1 w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-xs"
                  value={answers[q.question] || ''}
                  onChange={(e) => setAnswers((v) => ({ ...v, [q.question]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-widest py-3 border-2 border-foreground disabled:opacity-100 disabled:bg-primary"
      >
        {busy ? 'Preparing…' : 'Download Now'}
      </button>
      <p className="text-[11px] text-foreground/60">
        <Link href="/privacy" className="underline">Privacy Policy</Link>
      </p>
    </form>
  );
}
