import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteUrl}/api/sitemap.xml
`;

  return new NextResponse(txt, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
