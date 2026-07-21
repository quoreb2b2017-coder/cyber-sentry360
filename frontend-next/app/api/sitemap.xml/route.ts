import { NextResponse } from 'next/server';
import { getPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const db = getPublicClient();

  const { data: posts } = await db
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const { data: categories } = await db.from('categories').select('slug');

  const urls = [
    { loc: siteUrl, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/search`, changefreq: 'weekly', priority: '0.5' },
    ...(categories || []).map((c) => ({
      loc: `${siteUrl}/category/${c.slug}`,
      changefreq: 'daily',
      priority: '0.8',
    })),
    ...(posts || []).map((p) => ({
      loc: `${siteUrl}/article/${p.slug}`,
      lastmod: p.updated_at || p.published_at,
      changefreq: 'weekly',
      priority: '0.9',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
