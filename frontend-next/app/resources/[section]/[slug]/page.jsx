import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import DownloadForm from '@/components/resources/DownloadForm';
import { SITE_NAME, sectionByPath, verticalLabel } from '@/lib/resources';
import { getResourceBySlug } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata({ params }) {
  const item = await getResourceBySlug(params.slug).catch(() => null);
  if (!item) return { title: 'Resource' };
  return {
    title: item.meta_title || item.title,
    description: item.meta_description || item.description || undefined,
  };
}

export default async function ResourceDetailPage({ params }) {
  const section = sectionByPath(params.section);
  if (!section) notFound();
  const item = await getResourceBySlug(params.slug).catch(() => null);
  if (!item || item.status !== 'published' || item.category !== section.category) notFound();

  const inside = Array.isArray(item.inside_sections) ? item.inside_sections : [];

  return (
    <PublicLayout>
      <div className="max-w-[1100px] mx-auto px-5 py-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          <Link href="/resources" className="hover:text-primary">Resources</Link>
          <span className="mx-1.5">/</span>
          <Link href={section.href} className="hover:text-primary">{section.label}</Link>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          <div className="order-2 lg:order-1 space-y-5">
            <div className="overline text-primary">{verticalLabel(item.vertical)}</div>
            <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter leading-none">{item.title}</h1>
            {item.description ? <p className="text-lg text-foreground/80">{item.description}</p> : null}
            <p className="font-mono text-[11px] uppercase tracking-widest text-foreground/60">
              Offered by {item.offered_by || SITE_NAME}
              {item.author ? ` · ${item.author}` : ''}
            </p>
            {item.cover_url ? (
              <img src={item.cover_url} alt="" className="w-full h-auto border-2 border-foreground object-contain" />
            ) : null}
            {item.overview ? <div className="prose-editorial text-base leading-relaxed whitespace-pre-wrap">{item.overview}</div> : null}
            {inside.map((block) => (
              <section key={block.heading || block.body}>
                {block.heading ? <h2 className="font-heading font-bold uppercase text-lg mb-2">{block.heading}</h2> : null}
                {block.body ? <p className="text-foreground/85 leading-relaxed">{block.body}</p> : null}
              </section>
            ))}
          </div>
          <div id="download" className="order-1 lg:order-2 lg:sticky lg:top-20 scroll-mt-24">
            <DownloadForm resource={item} />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
