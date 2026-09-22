import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Newspaper, Search } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { ArticleCard, DeskTabs } from '@/components/ArticleCard';
import { DESKS } from '@/lib/desks';
import { POST_LIST_COLUMNS, toArticleListDTO } from '@/lib/posts';
import { getPublicClient } from '@/lib/supabase/public';

export const revalidate = 60;

const FALLBACK_META = Object.fromEntries(DESKS.map((d) => [d.slug, { name: d.name, blurb: d.blurb, slug: d.slug }]));

async function getCategoryData(slug) {
  const db = getPublicClient();
  const [articlesRes, catsRes] = await Promise.all([
    db
      .from('posts')
      .select(POST_LIST_COLUMNS)
      .eq('status', 'published')
      .eq('category', slug)
      .order('published_at', { ascending: false })
      .range(0, 39),
    db.from('categories').select('slug, name, description').eq('slug', slug).maybeSingle(),
  ]);

  const items = (articlesRes.data || []).map(toArticleListDTO);
  const fromApi = catsRes.data;
  const meta =
    (fromApi
      ? { slug: fromApi.slug, name: fromApi.name, blurb: fromApi.description || FALLBACK_META[slug]?.blurb }
      : null) ||
    FALLBACK_META[slug] ||
    { name: slug, blurb: null, slug };

  return { items, meta };
}

export default async function CategoryPage({ params }) {
  const slug = params?.slug;
  if (!slug) notFound();

  const { items, meta } = await getCategoryData(slug);
  const title = meta?.name || slug;
  const blurb = meta?.blurb || FALLBACK_META[slug]?.blurb;
  const tickerItems = items.slice(0, 6).map((a) => ({ slug: a.slug, title: a.title }));

  return (
    <PublicLayout tickerItems={tickerItems}>
      <div className="max-w-[1200px] mx-auto px-5 pb-12" data-testid="category-page">
        <header className="border-b-2 border-foreground py-5">
          <Link href="/" prefetch={false} className="inline-flex items-center gap-1.5 overline text-foreground/70 hover:text-primary mb-3">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="overline text-primary mb-1.5">Desk</div>
              <h1 className="font-heading font-black uppercase text-3xl md:text-[2.75rem] tracking-tighter leading-none capitalize">
                {title}
              </h1>
              {blurb && <p className="mt-3 lead-muted md:text-xl max-w-xl">{blurb}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest border-2 border-foreground px-2 py-1">
                {items.length} stor{items.length === 1 ? 'y' : 'ies'}
              </span>
              <Link href={`/search?category=${slug}`} prefetch={false} className="brutal-btn text-[10px] px-3 py-2 gap-2">
                <Search className="w-3.5 h-3.5" /> Search
              </Link>
            </div>
          </div>
        </header>

        <div className="-mt-[2px]">
          <DeskTabs active={slug} />
        </div>

        <section className="mt-6">
          {items.length === 0 ? (
            <div className="brutal-border bg-card p-10 text-center">
              <Newspaper className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="font-heading font-black uppercase text-xl tracking-tighter mb-2">
                No stories on this desk yet
              </h2>
              <p className="text-caption mb-5 max-w-md mx-auto">
                Mon &amp; Fri automation will publish here when this desk is next in rotation - or draft one now.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/" className="brutal-btn text-[10px]">
                  ← All stories
                </Link>
                <Link href="/admin/generate" className="brutal-btn-primary text-[10px]">
                  Draft with AI →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="font-heading font-black uppercase text-base tracking-tight">Latest from {title}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((a, i) => (
                  <ArticleCard key={a.slug} a={a} showCategory={false} priority={i < 3} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="mt-10">
          <div className="overline mb-3">Other desks</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {DESKS.filter((d) => d.slug !== slug).map((d) => (
              <Link
                key={d.slug}
                href={`/category/${d.slug}`}
                prefetch={false}
                className="brutal-border bg-card px-3 py-3 hover:bg-muted hover:shadow-brutal-sm transition-shadow duration-100 group"
              >
                <div className="font-heading font-bold uppercase text-sm group-hover:text-primary">{d.name}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-foreground/70 mt-1 line-clamp-1">
                  {d.blurb}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
