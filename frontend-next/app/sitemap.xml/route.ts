import { NextResponse } from 'next/server';
import { buildSitemapXml } from '@/lib/seo/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const xml = await buildSitemapXml();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('sitemap.xml error:', err);
    return new NextResponse('Sitemap unavailable', { status: 500 });
  }
}
