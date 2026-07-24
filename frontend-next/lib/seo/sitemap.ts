import { getPublicClient } from '@/lib/supabase/public';
import { getSiteUrl } from '@/lib/seo/site-url';

const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastMod(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export async function buildSitemapUrls(): Promise<SitemapUrl[]> {
  const siteUrl = getSiteUrl();
  const today = new Date().toISOString().slice(0, 10);

  let posts: Array<{
    slug: string;
    updated_at: string | null;
    published_at: string | null;
    tags: string[] | null;
  }> = [];

  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data) posts = data;
  } catch {
    // Static sitemap still works if Supabase is unavailable.
  }

  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const t = String(tag).trim();
      if (t) tagSet.add(t);
    }
  }

  const urls: SitemapUrl[] = [
    { loc: siteUrl, lastmod: posts[0] ? toLastMod(posts[0].updated_at || posts[0].published_at) : today, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/search`, lastmod: today, changefreq: 'weekly', priority: '0.5' },
    ...DESK_SLUGS.map((slug) => ({
      loc: `${siteUrl}/category/${slug}`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.85',
    })),
    ...posts.map((post) => ({
      loc: `${siteUrl}/article/${post.slug}`,
      lastmod: toLastMod(post.updated_at || post.published_at) || today,
      changefreq: 'weekly',
      priority: '0.9',
    })),
    ...[...tagSet].slice(0, 120).map((tag) => ({
      loc: `${siteUrl}/tag/${encodeURIComponent(tag)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.4',
    })),
  ];

  return urls;
}

export function sitemapUrlsToXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`    <loc>${escapeXml(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${escapeXml(u.changefreq)}</changefreq>`);
      if (u.priority) parts.push(`    <priority>${escapeXml(u.priority)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function buildSitemapXml(): Promise<string> {
  const urls = await buildSitemapUrls();
  return sitemapUrlsToXml(urls);
}
