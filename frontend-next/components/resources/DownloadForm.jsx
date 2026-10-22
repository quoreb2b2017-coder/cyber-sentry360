'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { consentParts, isPersonalEmail, publicConsent, publicStepFields } from '@/lib/resources';

function ConsentCopy({ text }) {
  const parts = consentParts(text);
  if (!parts.length) return text;
  return parts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <Link key={`${part.href}-${i}`} href={part.href} className="text-[#F58220] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
          {part.label}
        </Link>
      );
    }
    if (part.type === 'bold') return <strong key={i}>{part.value}</strong>;
    return <span key={i}>{part.value}</span>;
  });
}

async function savePdf(res, filename) {
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function DownloadForm({ resource }) {
  const config = resource.form_config || {};
  const fields = publicStepFields(config);
  const consent = publicConsent(config);
  const questions = Array.isArray(config.questions) ? config.questions.filter((q) => q.question) : [];
  const requiredChecks = consent.checks.filter((check) => check.required && !check.optOut);

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [values, setValues] = useState({});
  const [answers, setAnswers] = useState({});
  const [agreed, setAgreed] = useState({});
  const [leadId, setLeadId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filename = `${String(resource.slug || 'download').replace(/[^\w.-]+/g, '-')}.pdf`;
  const checksReady = requiredChecks.every((check) => agreed[check.id]);

  const payload = () => ({
    email,
    fields: { ...values, first_name: firstName, last_name: lastName },
    answers,
    consent: agreed,
    leadId,
  });

  const readError = async (res, fallback) => {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || fallback);
  };

  const downloadFile = async (body) => {
    const res = await fetch(`/api/resources/${resource.slug}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('pdf')) await readError(res, 'Download failed');
    await savePdf(res, filename);
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    const next = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) || isPersonalEmail(next)) {
      setError('Use a company email. Gmail, Yahoo, Outlook, Hotmail, iCloud, and other personal addresses are not accepted.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/resources/${resource.slug}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: next, saveOnly: true, profileCompleted: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.saved) throw new Error(data.detail || 'Could not save this download');
      setEmail(next);
      setLeadId(data.id || '');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Could not save this download');
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    const missingField = fields.find((field) => field.required !== false && !String(values[field.key] || '').trim());
    if (missingField) {
      setError(`${missingField.label} is required`);
      return;
    }
    const missingQuestion = questions.find((q) => !String(answers[q.question] || '').trim());
    if (missingQuestion) {
      setError('Answer every question before download');
      return;
    }
    if (!checksReady) {
      setError('Tick every required consent box before download');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await downloadFile(payload());
      setDone(true);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  const downloadAgain = async () => {
    setBusy(true);
    setError('');
    try {
      await downloadFile(payload());
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setBusy(false);
    }
  };

  const panel = 'mx-auto w-full max-w-[420px] bg-[#f3f3f3] text-[#0B1F3D] p-5 space-y-3';
  const inputClass = 'mt-1 w-full border border-[#0B1F3D]/20 bg-white px-3 py-2 text-sm text-[#0B1F3D]';
  const orangeBtn = 'inline-flex items-center justify-center gap-2 bg-[#F58220] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e67410] disabled:cursor-not-allowed disabled:bg-[#F58220] disabled:opacity-50';

  if (done) {
    return (
      <div className={`${panel} text-center`} data-testid="resource-download-form">
        <p className="font-heading text-xl font-bold">Download started</p>
        {error ? <p className="text-sm text-[#F58220]">{error}</p> : null}
        <button type="button" className={`${orangeBtn} mx-auto`} onClick={downloadAgain} disabled={busy}>
          <Download className="h-4 w-4" aria-hidden />
          {busy ? 'Preparing…' : 'Download PDF again'}
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <form onSubmit={submitEmail} className={panel} data-testid="resource-download-form">
        <label className="block text-sm">
          <span className="font-semibold">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </label>
        {consent.emailNote ? <p className="text-xs leading-snug text-[#0B1F3D]/75">{consent.emailNote}</p> : null}
        {error ? <p className="text-sm text-[#F58220]">{error}</p> : null}
        <div className="text-center">
          <button type="submit" disabled={busy} className={orangeBtn}>
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitDetails} className={panel} data-testid="resource-download-form">
      <label className="block text-sm">
        <span className="font-semibold">Work email</span>
        <input type="email" readOnly value={email} className={`${inputClass} bg-[#f3f3f3]`} />
      </label>
      {consent.emailNote ? <p className="text-xs leading-snug text-[#0B1F3D]/75">{consent.emailNote}</p> : null}
      <label className="block text-sm">
        <span className="font-semibold">First name</span>
        <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} autoComplete="given-name" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold">Last name</span>
        <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} autoComplete="family-name" />
      </label>
      {fields.map((field) => (
        <label key={field.key} className="block text-sm">
          <span className="font-semibold">{field.label}</span>
          <input
            type={field.type || 'text'}
            required={field.required !== false}
            value={values[field.key] || ''}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            className={inputClass}
          />
        </label>
      ))}
      {questions.map((q) => (
        <label key={q.question} className="block text-sm">
          <span className="font-semibold">{q.question}</span>
          {Array.isArray(q.options) && q.options.length >= 2 ? (
            <select
              required
              className={inputClass}
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
              className={inputClass}
              value={answers[q.question] || ''}
              onChange={(e) => setAnswers((v) => ({ ...v, [q.question]: e.target.value }))}
            />
          )}
        </label>
      ))}
      {consent.checks.map((check) => (
        <label key={check.id} className="flex items-start gap-2 text-sm leading-snug">
          <input
            type="checkbox"
            required={check.required === true && !check.optOut}
            checked={!!agreed[check.id]}
            onChange={(e) => setAgreed((v) => ({ ...v, [check.id]: e.target.checked }))}
            className="mt-1"
          />
          <span><ConsentCopy text={check.text} /></span>
        </label>
      ))}
      {error ? <p className="text-sm text-[#F58220]">{error}</p> : null}
      <div className="text-center">
        <button type="submit" disabled={busy || !checksReady} className={orangeBtn}>
          <Download className="h-4 w-4" aria-hidden />
          {busy ? 'Preparing…' : 'Download Now'}
        </button>
      </div>
      {consent.footerLine ? (
        <p className="text-center text-xs text-[#0B1F3D]/70">
          <ConsentCopy text={consent.footerLine} />
        </p>
      ) : null}
    </form>
  );
}
