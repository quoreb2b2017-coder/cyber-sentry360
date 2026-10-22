import { NextResponse } from 'next/server';
import { saveLeadSource } from '@/lib/lead-source';
import { isPersonalEmail, publicConsent, publicStepFields } from '@/lib/resources';
import { getAdminClient } from '@/lib/supabase/admin';
import { getResourceBySlug } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function saveMarketing(db: ReturnType<typeof getAdminClient>, email: string, marketing: boolean) {
  const now = new Date().toISOString();
  if (marketing) {
    const { error } = await db.from('newsletter_subscribers').upsert(
      { email, status: 'subscribed', subscribed_at: now, unsubscribed_at: null },
      { onConflict: 'email' }
    );
    return error?.message || null;
  }
  const { error } = await db.from('newsletter_subscribers').upsert(
    { email, status: 'unsubscribed', subscribed_at: now, unsubscribed_at: now },
    { onConflict: 'email' }
  );
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
  if (isPersonalEmail(email)) {
    return NextResponse.json(
      { detail: 'Use a company email. Gmail, Yahoo, Outlook, Hotmail, iCloud, and other personal addresses are not accepted.' },
      { status: 400 }
    );
  }

  const formConfig = (item.form_config || {}) as Record<string, unknown>;
  const stepFields = publicStepFields(formConfig);
  const questions = Array.isArray(formConfig.questions) ? formConfig.questions as Array<{ question?: string }> : [];
  const consent = publicConsent(formConfig);
  const fieldsIn = body.fields && typeof body.fields === 'object' ? body.fields as Record<string, unknown> : {};
  const answersIn = body.answers && typeof body.answers === 'object' ? body.answers as Record<string, unknown> : {};
  const consentIn = body.consent && typeof body.consent === 'object' ? body.consent as Record<string, unknown> : {};
  const saveOnly = body.saveOnly === true;

  const optedOut = consent.checks.some((check) => check.optOut && consentIn[check.id]);

  if (!saveOnly) {
    if (!String(fieldsIn.first_name || '').trim()) {
      return NextResponse.json({ detail: 'First name is required' }, { status: 400 });
    }
    if (!String(fieldsIn.last_name || '').trim()) {
      return NextResponse.json({ detail: 'Last name is required' }, { status: 400 });
    }
    for (const field of stepFields) {
      if (field.required !== false && !String(fieldsIn[field.key] || '').trim()) {
        return NextResponse.json({ detail: `${field.label} is required` }, { status: 400 });
      }
    }
    for (const question of questions) {
      if (question.question && !String(answersIn[question.question] || '').trim()) {
        return NextResponse.json({ detail: 'Answer every question before download' }, { status: 400 });
      }
    }
    for (const check of consent.checks) {
      if (check.optOut || !check.required) continue;
      if (!consentIn[check.id]) {
        return NextResponse.json({ detail: 'Tick every required consent box before download' }, { status: 400 });
      }
    }
  }

  const db = getAdminClient();
  if (!saveOnly) {
    const contactError = await saveMarketing(db, email, !optedOut);
    if (contactError) return NextResponse.json({ detail: contactError }, { status: 500 });
    const sourceError = await saveLeadSource(db, email, {
      type: ['whitepaper', 'report', 'case_study', 'webinar'].includes(String(item.category)) ? String(item.category) : 'whitepaper',
      slug: String(item.slug || ''),
      title: String(item.title || ''),
    });
    if (sourceError) return NextResponse.json({ detail: sourceError }, { status: 500 });
  }

  const savedAnswers = {
    ...answersIn,
    _consent: consentIn,
    _profileCompleted: !saveOnly,
    _marketingConsent: saveOnly ? null : !optedOut,
  };
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
    return NextResponse.json({ ok: true, saved: true, id: savedId, profileCompleted: false });
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
