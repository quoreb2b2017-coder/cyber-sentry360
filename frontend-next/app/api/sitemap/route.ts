import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Serve sitemap with headers Google expects (application/xml, public cache). */
export async function GET() {
  try {
    const xml = readFileSync(join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');

    if (!xml.includes('<urlset') || xml.includes('localhost')) {
      return NextResponse.json({ detail: 'Invalid sitemap content' }, { status: 500 });
    }

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    console.error('GET /api/sitemap failed:', err);
    return NextResponse.json({ detail: 'Sitemap unavailable' }, { status: 500 });
  }
}
