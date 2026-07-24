'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/api';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';

export const DESKS = [
  { slug: 'ai', name: 'AI', blurb: 'Models, agents, and enterprise AI risk' },
  { slug: 'cybersecurity', name: 'Cyber', blurb: 'Defense, resilience, and security ops' },
  { slug: 'threats', name: 'Threats', blurb: 'Actor tactics and emerging attacks' },
  { slug: 'policy', name: 'Policy', blurb: 'Regulation, compliance, and governance' },
  { slug: 'cloud', name: 'Cloud', blurb: 'Architecture, CSPM, and multi-cloud risk' },
  { slug: 'data', name: 'Data', blurb: 'Privacy, encryption, and DLP' },
];

export function ArticleCard({ a, showCategory = true, compact = false }) {
  return (
    <article className="editorial-card group h-full flex flex-col overflow-hidden">
      <Link href={`/article/${a.slug}`} prefetch className="flex flex-col h-full" data-testid={`card-${a.slug}`}>
        <div className={`overflow-hidden bg-muted relative shrink-0 ${compact ? 'aspect-[16/10]' : 'aspect-[16/9]'}`}>
          <img
            src={a.hero_image || HERO_FALLBACK}
            alt={a.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {showCategory && (
            <span className="absolute top-3 left-3 bg-foreground/90 text-background font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 capitalize backdrop-blur-sm">
              {a.category}
            </span>
          )}
        </div>
        <div className={`flex flex-col flex-1 ${compact ? 'p-3' : 'p-4 md:p-5'}`}>
          <time className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {formatDate(a.published_at || a.created_at)}
          </time>
          <h3 className="font-heading font-bold text-base md:text-lg leading-snug mt-2 group-hover:text-primary transition-colors line-clamp-3">
            {a.title}
          </h3>
          {a.subtitle && !compact && (
            <p className="mt-2 font-serif italic text-sm text-muted-foreground leading-snug line-clamp-2">
              {a.subtitle}
            </p>
          )}
          <span className="mt-auto pt-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-hover:text-primary inline-flex items-center gap-1.5 transition-colors">
            Read <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ArticleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="editorial-card">
          <div className="aspect-[16/9] bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-2.5 w-16 bg-muted" />
            <div className="h-5 w-full bg-muted" />
            <div className="h-5 w-3/4 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeskTabs({ active }) {
  return (
    <nav className="flex overflow-x-auto border-b border-foreground/20 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-hide">
      <Link
        href="/"
        prefetch
        className={`shrink-0 px-4 py-3 text-[11px] font-mono uppercase tracking-widest border-b-2 transition-colors ${
          !active ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        All
      </Link>
      {DESKS.map((d) => (
        <Link
          key={d.slug}
          href={`/category/${d.slug}`}
          prefetch
          className={`shrink-0 px-4 py-3 text-[11px] font-mono uppercase tracking-widest border-b-2 transition-colors ${
            active === d.slug ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          data-testid={`desk-tab-${d.slug}`}
        >
          {d.name}
        </Link>
      ))}
    </nav>
  );
}
