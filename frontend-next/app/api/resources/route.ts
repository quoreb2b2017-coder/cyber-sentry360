import { NextResponse } from 'next/server';
import { listResources } from '@/lib/resources-data';
import { verticalLabel } from '@/lib/resources';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  try {
    const rows = await listResources({ category, status: 'published' });
    const items = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      category: row.category,
      vertical: row.vertical,
      verticalLabel: verticalLabel(row.vertical),
      coverUrl: row.cover_url,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [], detail: err instanceof Error ? err.message : String(err) }, { status: 503 });
  }
}
