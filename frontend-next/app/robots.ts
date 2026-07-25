import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sitemap.xml', '/article/', '/category/', '/tag/', '/search'],
        disallow: ['/admin', '/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/sitemap.xml', '/article/', '/category/', '/tag/', '/search'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
