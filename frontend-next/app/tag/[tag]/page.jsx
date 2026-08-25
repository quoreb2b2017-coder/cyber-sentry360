import { notFound, permanentRedirect } from 'next/navigation';
import { tagToSlug } from '@/lib/seo/tag-slug';
import { getDeskPathForTagSlug } from '@/lib/posts/by-tag';

export const revalidate = 60;

export async function generateMetadata() {
  return {
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({ params }) {
  const { tag } = await params;
  const slug = tagToSlug(decodeURIComponent(String(tag || '')));
  if (!slug) notFound();

  const dest = await getDeskPathForTagSlug(slug);
  if (!dest) notFound();

  permanentRedirect(dest);
}
