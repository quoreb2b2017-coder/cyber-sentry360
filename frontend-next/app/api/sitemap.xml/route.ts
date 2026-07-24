import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/seo/site-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.redirect(`${getSiteUrl()}/sitemap.xml`, 301);
}
