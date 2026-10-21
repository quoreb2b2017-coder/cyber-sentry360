import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { ResourceHero } from '@/components/resources/ResourceChrome';
import { RESOURCE_MENU } from '@/lib/resources';
import { POST_LIST_COLUMNS, toArticleListDTO } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';

const blogs = RESOURCE_MENU[0];

export const metadata = {
  title: 'Blogs',
  description: 'Articles from cybersentry360. These are editorial posts, not PDF downloads.',
};

export const revalidate = 60;

export default async function BlogPage() {
  const db = getPublicClient();
  const { data } = await db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(0, 23);
  const articles = (data || []).map(toArticleListDTO);

  return (
    <PublicLayout>
      <ResourceHero
        badge={blogs.badge}
        heading={blogs.heading}
        paragraph={blogs.paragraph}
        pillars={blogs.pillars}
      />
      <div className="max-w-[1100px] mx-auto px-5 py-8">
        {articles.length === 0 ? (
          <p className="font-mono text-sm">No articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        )}
        <p className="mt-8">
          <Link href="/resources" className="overline hover:text-primary">All resources →</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
