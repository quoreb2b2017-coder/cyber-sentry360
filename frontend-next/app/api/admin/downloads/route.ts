import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const db = getAdminClient();
  const { data, error } = await db
    .from('resource_downloads')
    .select('id, email, fields, answers, created_at, resource_id')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  const ids = [...new Set((data || []).map((row) => row.resource_id).filter(Boolean))];
  let titles = new Map<string, string>();
  if (ids.length) {
    const { data: resources } = await db.from('resources').select('id, title').in('id', ids);
    titles = new Map((resources || []).map((row) => [row.id, row.title]));
  }

  return NextResponse.json({
    items: (data || []).map((row) => ({
      ...row,
      resource_title: titles.get(row.resource_id) || 'Deleted resource',
    })),
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ detail: 'id required' }, { status: 400 });

  const db = getAdminClient();
  const { data, error } = await db.from('resource_downloads').delete().eq('id', id).select('id');
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ detail: 'Download was not in the database' }, { status: 404 });

  const { data: still } = await db.from('resource_downloads').select('id').eq('id', id).maybeSingle();
  if (still) return NextResponse.json({ detail: 'Delete did not remove the database row' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
