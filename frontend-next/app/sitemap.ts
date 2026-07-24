import type { MetadataRoute } from 'next';
import { getPublicClient } from '@/lib/supabase/public';
import { getSiteUrl } from '@/lib/seo/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];

function toLastMod(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const db = getPublicClient();
  const now = new Date();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    db
      .from('posts')
      .select('slug, updated_at, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    db.from('categories').select('slug, updated_at'),
  ]);

  const categorySlugs = new Set<string>(DESK_SLUGS);
  for (const c of categories || []) {
    if (c.slug) categorySlugs.add(c.slug);
  }

  const tagSet = new Set<string>();
  for (const post of posts || []) {
    for (const tag of post.tags || []) {
      const t = String(tag).trim();
      if (t) tagSet.add(t);
    }
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: posts?.[0]?.updated_at ? toLastMod(posts[0].updated_at) : now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...[...categorySlugs].map((slug) => ({
      url: `${siteUrl}/category/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    ...(posts || []).map((post) => ({
      url: `${siteUrl}/article/${post.slug}`,
      lastModified: toLastMod(post.updated_at || post.published_at) || now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...[...tagSet].slice(0, 120).map((tag) => ({
      url: `${siteUrl}/tag/${encodeURIComponent(tag)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];

  return entries;
}
