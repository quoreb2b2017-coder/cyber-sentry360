import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const CHOICES = new Set(['accept_all', 'reject_all', 'custom']);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const choice = typeof body.choice === 'string' ? body.choice : 'custom';
    if (!CHOICES.has(choice)) {
      return NextResponse.json({ detail: 'Invalid choice' }, { status: 400 });
    }

    const analytics = !!body.analytics;
    const marketing = !!body.marketing;
    const version = Number(body.version) || 1;

    // Service role so logging works even if RLS/anon insert is not yet applied
    const db = getAdminClient();
    const { error } = await db.from('consent_events').insert({
      choice,
      necessary: true,
      analytics,
      marketing,
      consent_version: version,
    });

    if (error) {
      // Table may not exist yet — do not break the public consent UX
      console.warn('[consent] log failed:', error.message);
      return NextResponse.json({ ok: false, logged: false, detail: error.message }, { status: 202 });
    }

    return NextResponse.json({ ok: true, logged: true });
  } catch (err) {
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
