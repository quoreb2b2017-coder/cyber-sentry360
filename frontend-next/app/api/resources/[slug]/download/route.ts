import { NextResponse } from 'next/server';
import { saveLeadSource } from '@/lib/lead-source';
import { getAdminClient } from '@/lib/supabase/admin';
import { getResourceBySlug, toPublicResource } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isOptOutCheck(check: { text?: string; required?: boolean }) {
  const text = String(check.text || '');
  return check.required === false || /contact me|related research|marketing|opt out/i.test(text);
}

function optedIntoContact(checks: Array<{ text?: string; required?: boolean }>, consentIn: Record<string, unknown>) {
  const optOuts = checks.filter(isOptOutCheck);
  if (!optOuts.length) return false;
  return optOuts.every((check) => !consentIn[String(check.text || '')]);
}

async function saveDownloadContact(
  db: ReturnType<typeof getAdminClient>,
  email: string,
  checks: Array<{ text?: string; required?: boolean }>,
  consentIn: Record<string, unknown>
) {
  const now = new Date().toISOString();
  if (optedIntoContact(checks, consentIn)) {
    const { error } = await db.from('newsletter_subscribers').upsert(
      { email, status: 'subscribed', subscribed_at: now, unsubscribed_at: null },
      { onConflict: 'email' }
    );
    return error?.message || null;
  }

  const { data: existing, error: readError } = await db
    .from('newsletter_subscribers')
    .select('status')
    .eq('email', email)
    .maybeSingle();
  if (readError) return readError.message;
  if (existing?.status === 'subscribed') return null;

  if (!existing) {
    const { error } = await db.from('newsletter_subscribers').insert({
      email,
      status: 'unsubscribed',
      subscribed_at: now,
      unsubscribed_at: now,
    });
    return error?.message || null;
  }

  const { error } = await db
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: now })
    .eq('email', email);
  return error?.message || null;
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const item = await getResourceBySlug(params.slug);
  if (!item || item.status !== 'published' || !item.pdf_url) {
    return NextResponse.json({ detail: 'This download is not available' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').toLowerCase().trim();
  if (!isEmail(email)) return NextResponse.json({ detail: 'Work email is required' }, { status: 400 });

  const publicItem = toPublicResource(item as Record<string, unknown>);
  const form = publicItem.form_config as {
    fields: Array<{ key: string; label: string; required?: boolean }>;
    questions: Array<{ question: string; options?: string[] }>;
    consent: { checks?: Array<{ text: string; required?: boolean; visible?: boolean }>; extra?: Array<{ text: string; required?: boolean }>; showChecks?: boolean };
  };

  const fieldsIn = body.fields && typeof body.fields === 'object' ? body.fields : {};
  const answersIn = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const consentIn = body.consent && typeof body.consent === 'object' ? body.consent : {};
  const saveOnly = body.saveOnly === true;

  if (!saveOnly) {
    for (const field of form.fields || []) {
      if (!String(fieldsIn[field.key] || '').trim()) {
        return NextResponse.json({ detail: `${field.label} is required` }, { status: 400 });
      }
    }

    for (const question of form.questions || []) {
      if (question.question && !String(answersIn[question.question] || '').trim()) {
        return NextResponse.json({ detail: 'Answer every question before download' }, { status: 400 });
      }
    }
  }

  const visibleChecks = form.consent?.showChecks === false
    ? []
    : [...(form.consent?.checks || []), ...(form.consent?.extra || [])].filter(
        (c) => c.text && (c as { visible?: boolean }).visible !== false
      );
  for (const check of visibleChecks) {
    if (check.required !== false && !consentIn[check.text]) {
      return NextResponse.json({ detail: 'Tick every required consent box before download' }, { status: 400 });
    }
  }

  const db = getAdminClient();
  const contactError = await saveDownloadContact(db, email, visibleChecks, consentIn);
  if (contactError) return NextResponse.json({ detail: contactError }, { status: 500 });
  const sourceError = await saveLeadSource(db, email, {
    type: ['whitepaper', 'report', 'case_study', 'guide', 'webinar'].includes(String(item.category)) ? String(item.category) : 'whitepaper',
    slug: String(item.slug || ''),
    title: String(item.title || ''),
  });
  if (sourceError) return NextResponse.json({ detail: sourceError }, { status: 500 });

  const savedAnswers = { ...answersIn, _consent: consentIn };
  const leadId = String(body.leadId || '');
  let savedId = leadId;

  if (leadId) {
    const { data: updated, error: updateError } = await db
      .from('resource_downloads')
      .update({ email, fields: fieldsIn, answers: savedAnswers })
      .eq('id', leadId)
      .eq('resource_id', item.id)
      .select('id');
    if (updateError) return NextResponse.json({ detail: updateError.message }, { status: 500 });
    savedId = updated?.[0]?.id || '';
  }

  if (!savedId) {
    const { data: inserted, error: downloadError } = await db
      .from('resource_downloads')
      .insert({
        resource_id: item.id,
        email,
        fields: fieldsIn,
        answers: savedAnswers,
      })
      .select('id')
      .single();
    if (downloadError) return NextResponse.json({ detail: downloadError.message }, { status: 500 });
    savedId = inserted.id;
  }

  if (saveOnly) {
    return NextResponse.json({ ok: true, saved: true, id: savedId });
  }

  const pdf = await fetch(item.pdf_url);
  if (!pdf.ok) {
    return NextResponse.json({ detail: 'The PDF file is not available' }, { status: 502 });
  }
  const bytes = await pdf.arrayBuffer();
  const filename = `${String(item.slug || 'download').replace(/[^\w.-]+/g, '-')}.pdf`;
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
