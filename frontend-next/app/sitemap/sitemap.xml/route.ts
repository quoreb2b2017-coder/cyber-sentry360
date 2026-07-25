import { SITEMAP_XML } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Serves pre-built sitemap XML without Vercel static Content-Disposition headers. */
export async function GET() {
  const xml = SITEMAP_XML?.trim();
  if (!xml?.startsWith('<?xml')) {
    return new Response(fallback(), { status: 200, headers: headers() });
  }
  return new Response(xml.endsWith('\n') ? xml : `${xml}\n`, {
    status: 200,
    headers: headers(),
  });
}

function headers() {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'X-Content-Type-Options': 'nosniff',
  } as const;
}

function fallback() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.cybersentry360.com</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`;
}
