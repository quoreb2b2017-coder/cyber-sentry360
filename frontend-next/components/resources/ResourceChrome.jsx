import Link from 'next/link';
import { SITE_NAME } from '@/lib/resources';

export function ResourceHero({ badge, heading, paragraph, pillars }) {
  return (
    <header className="relative border-b-2 border-foreground bg-card overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-foreground to-primary" aria-hidden />
      <div className="max-w-[1100px] mx-auto px-5 pt-8 pb-8 grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-8 items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/resources" className="hover:text-primary">Resources</Link>
            <span className="mx-1.5">/</span>
            <span>{heading}</span>
          </p>
          <div className="overline text-primary mb-2">{badge}</div>
          <h1 className="font-serif font-semibold text-4xl md:text-5xl tracking-tight leading-none">{heading}</h1>
          <p className="mt-4 text-base md:text-lg text-foreground/80 max-w-xl leading-relaxed">{paragraph}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {(pillars || []).map((item) => (
              <li key={item} className="border-2 border-foreground px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden lg:block border-2 border-foreground bg-foreground text-background p-6 min-h-[180px]" aria-hidden>
          <div className="overline text-primary mb-3">{SITE_NAME}</div>
          <p className="font-serif italic text-2xl leading-snug">Research for security leaders.</p>
          <div className="mt-6 h-1 w-24 bg-gradient-to-r from-foreground to-primary" />
        </div>
      </div>
    </header>
  );
}

export function SponsorBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t-2 border-foreground bg-primary text-primary-foreground">
      <div className="max-w-[1100px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
        <span>Brought to you through {SITE_NAME}</span>
        <span className="normal-case tracking-normal">
          <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/unsubscribe" className="underline underline-offset-2">Unsubscribe</Link>
        </span>
      </div>
    </div>
  );
}

export function ComingSoon() {
  return (
    <div className="max-w-[720px] mx-auto px-5 py-16 text-center" data-testid="resources-coming-soon">
      <div className="overline text-primary mb-2">Coming soon</div>
      <h2 className="font-heading font-black uppercase text-3xl tracking-tighter">Nothing published in this section yet</h2>
      <p className="mt-3 text-foreground/75">This page stays empty until a matching item is published. It is not filled with blog posts.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/blog" className="brutal-btn text-[10px]">Blogs</Link>
        <Link href="/resources/whitepapers?type=whitepaper" className="brutal-btn-primary text-[10px]">White papers</Link>
      </div>
    </div>
  );
}
