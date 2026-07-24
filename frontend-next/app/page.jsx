'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate } from '@/lib/api';
import { ArrowRight, Clock, Newspaper } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import { ArticleCard, ArticleGridSkeleton, DeskTabs, DESKS } from '@/components/ArticleCard';
import { NewsletterSubscribe } from '@/components/NewsletterSubscribe';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';

function SideStory({ article, index }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      prefetch
      className="group flex gap-3 py-3 border-b border-foreground/15 last:border-0 hover:bg-muted/40 -mx-2 px-2 transition-colors"
    >
      <span className="font-heading font-black text-lg text-primary/80 w-6 shrink-0 pt-0.5">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <span className="section-label capitalize">{article.category}</span>
        <h3 className="font-heading font-bold text-sm leading-snug mt-1 group-hover:text-primary line-clamp-3">
          {article.title}
        </h3>
        <span className="text-[11px] text-muted-foreground mt-1 block">
          {formatDate(article.published_at || article.created_at)}
        </span>
      </div>
    </Link>
  );
}

function FeaturedHero({ article }) {
  if (!article) return null;
  return (
    <Link
      href={`/article/${article.slug}`}
      prefetch
      className="group block editorial-card overflow-hidden"
      data-testid="featured-story"
    >
      <div className="relative aspect-[16/9] md:aspect-[2.1/1] overflow-hidden bg-muted">
        <img
          src={article.hero_image || HERO_FALLBACK}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
            <span className="section-label !text-primary-foreground bg-primary px-2 py-0.5 capitalize">
              {article.category}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/70">
              {formatDate(article.published_at || article.created_at)}
            </span>
            {article.reading_time && (
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {article.reading_time} min read
              </span>
            )}
          </div>
          <h2 className="font-heading font-black text-2xl md:text-4xl lg:text-[2.75rem] tracking-tight leading-[1.08] max-w-4xl group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          {article.subtitle && (
            <p className="mt-3 font-serif italic text-base md:text-lg text-white/85 max-w-2xl line-clamp-2">
              {article.subtitle}
            </p>
          )}
          <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
            Read story <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-feed'],
    queryFn: async () => {
      const [a, top] = await Promise.all([
        api.get('/articles?limit=12').catch(() => ({ data: { items: [] } })),
        api.get('/trending-topics').catch(() => ({ data: { topics: [] } })),
      ]);
      return { articles: a.data.items || [], topics: top.data.topics || [] };
    },
  });

  const articles = data?.articles || [];
  const topics = data?.topics || [];
  const loading = isLoading && !data;
  const featured = articles[0];
  const sideStories = articles.slice(1, 5);
  const gridArticles = articles.slice(5, 11);

  const issueDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <PublicLayout>
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-16" data-testid="home-page">
        {/* Masthead */}
        <header className="py-6 md:py-8 border-b border-foreground/20">
          <p className="section-label text-primary mb-2">{issueDate}</p>
          <h1 className="font-heading font-black text-3xl md:text-4xl tracking-tight leading-none">
            AI &amp; Cybersecurity Intelligence
          </h1>
          <p className="mt-2 text-muted-foreground text-base md:text-lg max-w-2xl">
            Original reporting for security leaders, builders, and defenders.
          </p>
        </header>

        <div className="mt-0">
          <DeskTabs />
        </div>

        {loading ? (
          <div className="mt-8 animate-pulse space-y-6">
            <div className="aspect-[2/1] bg-muted editorial-card" />
            <ArticleGridSkeleton />
          </div>
        ) : !articles.length ? (
          <div className="editorial-card p-12 text-center my-10">
            <Newspaper className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-heading font-bold text-xl mb-2">No stories published yet</h2>
            <p className="text-muted-foreground mb-5">Generate your first article from the newsroom.</p>
            <Link href="/admin/generate" className="brutal-btn-primary text-[10px]">
              Open newsroom →
            </Link>
          </div>
        ) : (
          <>
            {/* Hero + sidebar */}
            <section className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8">
                <FeaturedHero article={featured} />
              </div>
              {sideStories.length > 0 && (
                <aside className="lg:col-span-4 flex flex-col">
                  <div className="section-heading mb-1">Also reporting</div>
                  <div className="editorial-card p-4 flex-1">
                    {sideStories.map((a, i) => (
                      <SideStory key={a.slug} article={a} index={i} />
                    ))}
                  </div>
                </aside>
              )}
            </section>

            {/* Main grid */}
            {gridArticles.length > 0 && (
              <section className="mt-12 md:mt-14">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="section-heading">Latest analysis</h2>
                  <Link href="/search" className="section-link" data-testid="view-all-articles">
                    View archive <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {gridArticles.map((a) => (
                    <ArticleCard key={a.slug} a={a} />
                  ))}
                </div>
              </section>
            )}

            {/* If fewer than 6 total, show remaining in grid */}
            {articles.length > 1 && articles.length <= 5 && (
              <section className="mt-12">
                <h2 className="section-heading mb-5">More stories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {articles.slice(1).map((a) => (
                    <ArticleCard key={a.slug} a={a} />
                  ))}
                </div>
              </section>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <section className="mt-12 pt-8 border-t border-foreground/20" data-testid="trending-topics">
                <h2 className="section-heading mb-4">Trending topics</h2>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <Link
                      key={t.tag}
                      href={`/tag/${encodeURIComponent(t.tag)}`}
                      className="tag-chip"
                      data-testid={`topic-${t.tag}`}
                    >
                      {t.tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Desks */}
            <section className="mt-12">
              <h2 className="section-heading mb-4">Browse by desk</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {DESKS.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/category/${d.slug}`}
                    prefetch
                    className="desk-pill group"
                  >
                    <span className="font-heading font-bold text-sm group-hover:text-primary">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 font-serif italic leading-tight hidden sm:block">
                      {d.blurb}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Newsletter */}
            <section className="mt-14 editorial-card bg-foreground text-background p-6 md:p-8" data-testid="hero-newsletter">
              <div className="max-w-xl">
                <p className="section-label !text-primary mb-2">Newsletter</p>
                <h2 className="font-heading font-black text-xl md:text-2xl tracking-tight">
                  Weekly security brief
                </h2>
                <p className="mt-2 text-sm text-background/80 font-serif italic">
                  One curated dispatch every Tuesday. No noise.
                </p>
              </div>
              <div className="mt-5 max-w-md">
                <NewsletterSubscribe variant="footer" testid="hero-newsletter" />
              </div>
            </section>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
