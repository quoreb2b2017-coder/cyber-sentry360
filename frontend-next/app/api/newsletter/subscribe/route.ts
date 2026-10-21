import { NextResponse } from 'next/server';
import { resolveLeadSource, saveLeadSource } from '@/lib/lead-source';
import { getAdminClient } from '@/lib/supabase/admin';

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const e = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/** Subscribe (or re-subscribe) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ detail: 'Valid email required' }, { status: 400 });
    }

    const db = getAdminClient();
    const { data: existing } = await db
      .from('newsletter_subscribers')
      .select('email, status')
      .eq('email', email)
      .maybeSingle();

    if (existing?.status === 'subscribed') {
      return NextResponse.json(
        { detail: 'This email is already subscribed. Enter a new email.', already: true },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await db
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          status: 'subscribed',
          subscribed_at: now,
          unsubscribed_at: null,
        },
        { onConflict: 'email' }
      )
      .select('email, status, subscribed_at')
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 500 });
    }

    const source = await resolveLeadSource(db, body);
    const sourceError = await saveLeadSource(db, email, source);
    if (sourceError) {
      return NextResponse.json({ detail: sourceError }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscribed: true, subscriber: data, source });
  } catch (err) {
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}

/** Check subscription status: GET /api/newsletter/subscribe?email=... */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get('email'));
    if (!email) {
      return NextResponse.json({ detail: 'Valid email required' }, { status: 400 });
    }

    const db = getAdminClient();
    const { data } = await db
      .from('newsletter_subscribers')
      .select('email, status, subscribed_at, unsubscribed_at')
      .eq('email', email)
      .maybeSingle();

    const subscribed = data?.status === 'subscribed';
    return NextResponse.json({
      email,
      subscribed,
      status: data?.status || 'none',
      subscriber: data || null,
    });
  } catch (err) {
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
