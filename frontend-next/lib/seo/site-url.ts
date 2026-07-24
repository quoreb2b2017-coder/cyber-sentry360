/** Canonical public site URL for sitemap, robots, and metadata. */
export function getSiteUrl(): string {
  const normalize = (raw: string) => raw.trim().replace(/\/+$/, '');

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    configured &&
    !configured.includes('localhost') &&
    !configured.includes('your-domain')
  ) {
    return withPreferredWww(normalize(configured.startsWith('http') ? configured : `https://${configured}`));
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, '');
    return withPreferredWww(normalize(`https://${host}`));
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return withPreferredWww(normalize(`https://${host}`));
  }

  return normalize(withPreferredWww(configured || 'http://localhost:3000'));
}

function withPreferredWww(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (parsed.hostname === 'cybersentry360.com') {
      parsed.hostname = 'www.cybersentry360.com';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.replace(/\/$/, '');
  }
}
