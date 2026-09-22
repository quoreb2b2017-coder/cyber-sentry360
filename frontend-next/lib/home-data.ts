import { unstable_cache } from 'next/cache';
import { POST_LIST_COLUMNS, toArticleListDTO } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';

async function fetchHomeArticles(limit = 12) {
  const db = getPublicClient();
  const { data, error } = await db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(0, Math.max(0, limit - 1));

  if (error) {
    console.warn('[home-data] articles:', error.message);
    return [];
  }
  return (data || []).map(toArticleListDTO);
}

async function fetchTrendingTopics(limit = 20) {
  const db = getPublicClient();
  // Only recent posts — avoids full-table tag scans
  const { data, error } = await db
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(80);

  if (error) {
    console.warn('[home-data] topics:', error.message);
    return [];
  }

  const counts: Record<string, number> = {};
  for (const p of data || []) {
    for (const tag of p.tags || []) {
      if (!tag) continue;
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Cached home payload — shared by page + avoids dual client API hops. */
export const getHomeData = unstable_cache(
  async () => {
    const [articles, topics] = await Promise.all([
      fetchHomeArticles(12),
      fetchTrendingTopics(20),
    ]);
    return { articles, topics };
  },
  ['home-feed-v1'],
  { revalidate: 60, tags: ['home-feed'] }
);
