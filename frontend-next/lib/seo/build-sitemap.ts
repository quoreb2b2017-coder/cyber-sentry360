import type { MetadataRoute } from 'next';
import { getPublicClient } from '@/lib/supabase/public';
import { getSiteUrl } from '@/lib/seo/site-url';

const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

function toLastMod(value: string | null | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Build sitemap entries from published posts. Falls back to static URLs if DB is unavailable. */
export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const today = new Date();

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

  const homeLastMod = posts[0] ? toLastMod(posts[0].updated_at || posts[0].published_at) : today;

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: homeLastMod, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/search`, lastModified: today, changeFrequency: 'weekly', priority: 0.5 },
    ...DESK_SLUGS.map((slug) => ({
      url: `${siteUrl}/category/${slug}`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/article/${post.slug}`,
      lastModified: toLastMod(post.updated_at || post.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...[...tagSet].slice(0, 120).map((tag) => ({
      url: `${siteUrl}/tag/${encodeURIComponent(tag)}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];

  if (process.env.VERCEL === '1') {
    for (const entry of entries) {
      if (entry.url.includes('localhost') || entry.url.includes('127.0.0.1')) {
        throw new Error('Sitemap contains localhost URLs on production');
      }
    }
  }

  return entries;
}
