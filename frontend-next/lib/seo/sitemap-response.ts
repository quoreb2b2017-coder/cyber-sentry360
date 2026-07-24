import { buildSitemapXml, minimalSitemapXml } from '@/lib/seo/build-sitemap';
import { GENERATED_SITEMAP_XML } from '@/lib/seo/generated-sitemap';

const SITEMAP_HEADERS = {
  'Content-Type': 'text/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function createSitemapResponse() {
  const cached = GENERATED_SITEMAP_XML?.trim();
  if (cached?.startsWith('<?xml')) {
    if (process.env.VERCEL === '1' && (cached.includes('localhost') || cached.includes('127.0.0.1'))) {
      // fall through to runtime builder
    } else {
      return new Response(cached.endsWith('\n') ? cached : `${cached}\n`, {
        status: 200,
        headers: SITEMAP_HEADERS,
      });
    }
  }

  try {
    const xml = await buildSitemapXml();
    return new Response(xml, { status: 200, headers: SITEMAP_HEADERS });
  } catch (err) {
    console.error('Sitemap generation failed, serving minimal fallback:', err);
    return new Response(minimalSitemapXml(), { status: 200, headers: SITEMAP_HEADERS });
  }
}
