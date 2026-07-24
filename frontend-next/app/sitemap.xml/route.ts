import { createSitemapResponse } from '@/lib/seo/sitemap-response';

export const runtime = 'nodejs';

export async function GET() {
  return createSitemapResponse();
}
