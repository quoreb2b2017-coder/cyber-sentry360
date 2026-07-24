import { SITEMAP_XML } from '@/lib/seo/sitemap-xml';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function GET() {
  const xml = SITEMAP_XML?.trim();
  if (!xml?.startsWith('<?xml')) {
    return new Response(minimalFallback(), { status: 200, headers: HEADERS });
  }
  return new Response(xml.endsWith('\n') ? xml : `${xml}\n`, { status: 200, headers: HEADERS });
}

function minimalFallback() {
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
