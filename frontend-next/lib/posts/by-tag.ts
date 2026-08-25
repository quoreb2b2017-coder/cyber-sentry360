import { cache } from 'react';
import { getPublicClient } from '@/lib/supabase/public';
import { POST_LIST_COLUMNS, toArticleListDTO } from '@/lib/posts';
import { tagToSlug } from '@/lib/seo/tag-slug';
import type { ArticleDTO } from '@/lib/types';

const DESKS = new Set(['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data']);

function collectTagVariants(rows: Array<{ tags?: string[] | null }>, slug: string): string[] {
  const names = new Set<string>();
  for (const row of rows || []) {
    for (const t of row.tags || []) {
      const name = String(t || '').trim();
      if (name && tagToSlug(name) === slug) names.add(name);
    }
  }
  return [...names];
}

export const getPublishedArticlesByTagSlug = cache(async function getPublishedArticlesByTagSlug(
  slug: string,
  limit = 40
): Promise<{ items: ArticleDTO[]; label: string }> {
  const normalized = tagToSlug(slug);
  if (!normalized) return { items: [], label: slug };

  const db = getPublicClient();
  const { data: tagRows, error: tagError } = await db
    .from('posts')
    .select('tags')
    .eq('status', 'published');

  if (tagError) throw tagError;

  const variants = collectTagVariants(tagRows || [], normalized);
  if (!variants.length) {
    return { items: [], label: normalized.replace(/-/g, ' ') };
  }

  const { data, error } = await db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .overlaps('tags', variants)
    .order('published_at', { ascending: false })
    .limit(Math.min(limit, 100));

  let rows = data || [];
  if (error) {
    const fallback = await db
      .from('posts')
      .select(POST_LIST_COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(200);
    if (fallback.error) throw error;
    rows = fallback.data || [];
  }

  const items = rows
    .filter((p) => (p.tags || []).some((t: string) => tagToSlug(t) === normalized))
    .slice(0, limit)
    .map(toArticleListDTO);

  return { items, label: variants[0] };
});

/** Map a tag URL to the desk that owns most of its stories (for 301). */
export async function getDeskPathForTagSlug(slug: string): Promise<string | null> {
  const { items } = await getPublishedArticlesByTagSlug(slug, 40);
  if (!items.length) return null;

  const counts = new Map<string, number>();
  for (const item of items) {
    const desk = String(item.category || '');
    if (!DESKS.has(desk)) continue;
    counts.set(desk, (counts.get(desk) || 0) + 1);
  }

  let best = '';
  let bestCount = 0;
  for (const [desk, count] of counts) {
    if (count > bestCount) {
      best = desk;
      bestCount = count;
    }
  }

  return best ? `/category/${best}` : '/';
}
