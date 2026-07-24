import { getPublicClient } from '@/lib/supabase/public';
import { getSiteUrl } from '@/lib/seo/site-url';

const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastMod(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/** Build sitemap XML from published posts. Falls back to static URLs if DB is unavailable. */
export async function buildSitemapXml(): Promise<string> {
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
    const { data } = await db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    posts = data || [];
  } catch {
    // Static fallback URLs still allow Google to crawl the site.
  }

  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const t = String(tag).trim();
      if (t) tagSet.add(t);
    }
  }

  const entries = [
    urlEntry(siteUrl, posts[0] ? toLastMod(posts[0].updated_at || posts[0].published_at) : today, 'daily', '1.0'),
    urlEntry(`${siteUrl}/search`, today, 'weekly', '0.5'),
    ...DESK_SLUGS.map((slug) => urlEntry(`${siteUrl}/category/${slug}`, today, 'daily', '0.85')),
    ...posts.map((post) =>
      urlEntry(
        `${siteUrl}/article/${post.slug}`,
        toLastMod(post.updated_at || post.published_at),
        'weekly',
        '0.9'
      )
    ),
    ...[...tagSet].slice(0, 120).map((tag) =>
      urlEntry(`${siteUrl}/tag/${encodeURIComponent(tag)}`, today, 'weekly', '0.4')
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  if (process.env.VERCEL === '1' && (xml.includes('localhost') || xml.includes('127.0.0.1'))) {
    throw new Error('Sitemap contains localhost URLs on production');
  }

  return xml;
}

export function minimalSitemapXml(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.cybersentry360.com</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}
