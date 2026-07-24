/** Canonical public site URL for sitemap, robots, and metadata. */
export function getSiteUrl(): string {
  const normalize = (raw: string) => raw.trim().replace(/\/+$/, '');

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    configured &&
    !configured.includes('localhost') &&
    !configured.includes('your-domain')
  ) {
    return normalize(configured.startsWith('http') ? configured : `https://${configured}`);
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, '');
    return normalize(`https://${host}`);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return normalize(`https://${host}`);
  }

  return normalize(configured || 'http://localhost:3000');
}
