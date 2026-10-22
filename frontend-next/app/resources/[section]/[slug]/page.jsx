import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import DownloadForm from '@/components/resources/DownloadForm';
import { ResourceShare, ResourceSummary } from '@/components/resources/ResourceSummary';
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
            {item.cover_url ? (
              <img
                src={item.cover_url}
                alt=""
                className="block border-2 border-foreground object-contain"
                style={{ width: 'auto', height: 'auto', maxWidth: 520, maxHeight: 360 }}
              />
            ) : null}
            <div className="overline text-primary">{verticalLabel(item.vertical)}</div>
            <h1 className="font-heading font-black uppercase text-3xl md:text-4xl tracking-tighter leading-none">{item.title}</h1>
            <ResourceSummary description={item.description} overview={item.overview} inside={inside} />
            <p className="font-mono text-[11px] uppercase tracking-widest text-foreground/60">
              Offered by {item.offered_by || SITE_NAME}
              {item.author ? ` · ${item.author}` : ''}
            </p>
            <ResourceShare title={item.title} />
          </div>
          <div id="download" className="order-1 lg:order-2 lg:sticky lg:top-20 scroll-mt-24">
            <DownloadForm resource={item} />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
