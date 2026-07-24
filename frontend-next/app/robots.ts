import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sitemap.xml', '/google-sitemap.xml', '/article/', '/category/', '/tag/', '/search'],
        disallow: ['/admin', '/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/sitemap.xml', '/google-sitemap.xml', '/article/', '/category/', '/tag/', '/search'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/google-sitemap.xml`],
  };
}
