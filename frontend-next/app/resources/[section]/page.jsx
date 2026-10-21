import { notFound } from 'next/navigation';
import PublicLayout from '@/components/PublicLayout';
import { ComingSoon, ResourceHero } from '@/components/resources/ResourceChrome';
import ResourceLibrary from '@/components/resources/ResourceLibrary';
import { sectionByPath } from '@/lib/resources';
import { listResources } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function ResourceSectionPage({ params }) {
  const section = sectionByPath(params.section);
  if (!section) notFound();

  let items = [];
  try {
    items = await listResources({ category: section.category, status: 'published' });
  } catch {
    items = [];
  }

  return (
    <PublicLayout>
      <ResourceHero
        badge={section.badge}
        heading={section.heading}
        paragraph={section.paragraph}
        pillars={section.pillars}
      />
      {items.length === 0 ? (
        <ComingSoon />
      ) : (
        <ResourceLibrary items={items} hideCategoryFilter />
      )}
    </PublicLayout>
  );
}
