import { createSitemapResponse } from '@/lib/seo/sitemap-response';

export const runtime = 'nodejs';

/** Alternate sitemap URL for GSC cache-bust resubmits. */
export async function GET() {
  return createSitemapResponse();
}
