import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-static';
export const revalidate = 3600;

const SITEMAP_FILE = join(process.cwd(), 'lib/seo/sitemap.generated.xml');

export async function GET() {
  const xml = readFileSync(SITEMAP_FILE, 'utf8');

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
