import Link from 'next/link';
import { notFound } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import DownloadForm from '@/components/resources/DownloadForm';
import { SITE_NAME, sectionByCategory } from '@/lib/resources';
import { getResourceBySlug } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata({ params }) {
  const item = await getResourceBySlug(params.slug).catch(() => null);
  if (!item) return { title: 'Download' };
  return {
    title: `Download ${item.meta_title || item.title}`,
    description: item.meta_description || item.description || undefined,
  };
}

export default async function DownloadPage({ params }) {
  const item = await getResourceBySlug(params.slug).catch(() => null);
  if (!item || item.status !== 'published' || !item.pdf_url) notFound();
  const section = sectionByCategory(item.category);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[1100px] px-5 py-8">
        <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link href="/resources" className="hover:text-primary">Resources</Link>
          {section ? (
            <>
              <span className="mx-1.5">/</span>
              <Link href={section.path || section.href} className="hover:text-primary">{section.label}</Link>
            </>
          ) : null}
        </p>
        <h1 className="mx-auto mb-6 max-w-[420px] text-center font-heading text-3xl font-black uppercase tracking-tighter text-[#0B1F3D]">
          {item.title}
        </h1>
        <DownloadForm resource={item} />
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-widest text-[#0B1F3D]/60">
          Offered by {item.offered_by || SITE_NAME}
          {item.author ? ` · ${item.author}` : ''}
        </p>
      </div>
    </PublicLayout>
  );
}
