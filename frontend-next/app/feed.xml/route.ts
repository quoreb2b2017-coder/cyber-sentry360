import { buildRssXml, RSS_HEADERS } from '@/lib/seo/rss-feed';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const xml = await buildRssXml();
    return new Response(xml, {
      status: 200,
      headers: RSS_HEADERS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${message}</error>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
