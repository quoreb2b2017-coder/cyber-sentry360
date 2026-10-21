import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { ResourceHero } from '@/components/resources/ResourceChrome';
import { RESOURCE_MENU, SITE_NAME } from '@/lib/resources';

export const metadata = {
  title: 'Resources',
  description: `Research library from ${SITE_NAME}: blogs, white papers, reports, case studies, guides, and webinars.`,
};

export default function ResourcesHubPage() {
  return (
    <PublicLayout>
      <ResourceHero
        badge="Resources"
        heading="Resources"
        paragraph={`${SITE_NAME} publishes articles and downloadable research. Pick a section. Each downloadable section only lists items saved in that category.`}
        pillars={['Six sections', 'First-party PDFs', 'No extra types']}
      />
      <div className="max-w-[1100px] mx-auto px-5 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RESOURCE_MENU.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className="brutal-border bg-card p-5 hover:shadow-brutal-sm transition-shadow"
            data-testid={`resource-hub-${section.key}`}
          >
            <div className="font-heading font-black text-3xl text-primary">{section.number}</div>
            <h2 className="mt-2 font-heading font-bold uppercase tracking-tight text-xl">{section.label}</h2>
            <p className="mt-2 text-sm text-foreground/75 leading-snug">{section.paragraph}</p>
          </Link>
        ))}
      </div>
    </PublicLayout>
  );
}
