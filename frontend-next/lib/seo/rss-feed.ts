import { getPublicClient } from '@/lib/supabase/public';
import { POST_LIST_COLUMNS, toArticleListDTO } from '@/lib/posts';
import { getSiteUrl } from '@/lib/seo/site-url';
import type { ArticleDTO } from '@/lib/types';

const FEED_LIMIT = 500;
const CHANNEL_TITLE = 'cybersentry360';
const CHANNEL_DESCRIPTION =
  'Rigorous AI and cybersecurity reporting for builders, CISOs, and enterprise technology leaders. Published by Quore B2B Marketing.';
const DEFAULT_AUTHOR = 'cybersentry360 Editorial';

const DESK_LABELS: Record<string, string> = {
  ai: 'AI',
  cybersecurity: 'Cybersecurity',
  threats: 'Threats',
  policy: 'Policy',
  cloud: 'Cloud',
  data: 'Data',
};

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${String(value).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function toRfc822(value?: string | null): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function absoluteUrl(maybeUrl: string | null | undefined, siteUrl: string): string | null {
  if (!maybeUrl) return null;
  const raw = String(maybeUrl).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${siteUrl}${raw}`;
  return `${siteUrl}/${raw}`;
}

function deskLabel(category: string): string {
  const key = String(category || '').toLowerCase();
  return DESK_LABELS[key] || category || 'Editorial';
}

function summaryFor(article: ArticleDTO): string {
  return (
    article.excerpt ||
    article.seo_description ||
    article.subtitle ||
    article.title ||
    ''
  ).trim();
}

function guessImageType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function getPublishedArticlesForFeed(limit = FEED_LIMIT): Promise<ArticleDTO[]> {
  const db = getPublicClient();
  const { data, error } = await db
    .from('posts')
    .select(POST_LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), FEED_LIMIT));

  if (error) throw error;
  return (data || []).map(toArticleListDTO);
}

export async function buildRssXml(): Promise<string> {
  const siteUrl = getSiteUrl();
  const feedUrl = `${siteUrl}/feed.xml`;
  const articles = await getPublishedArticlesForFeed(FEED_LIMIT);
  const lastBuild = toRfc822(articles[0]?.published_at || articles[0]?.updated_at || null);

  const items = articles
    .map((article) => {
      const link = `${siteUrl}/article/${article.slug}`;
      const title = article.title || 'Untitled';
      const description = summaryFor(article);
      const author = (article.author || DEFAULT_AUTHOR).trim() || DEFAULT_AUTHOR;
      const category = deskLabel(article.category);
      const pubDate = toRfc822(article.published_at || article.created_at);
      const image = absoluteUrl(article.hero_image, siteUrl);
      const encoded = `<p>${escapeXml(description)}</p>${
        image ? `<p><img src="${escapeXml(image)}" alt="${escapeXml(title)}" /></p>` : ''
      }`;

      const media = image
        ? `
      <enclosure url="${escapeXml(image)}" type="${guessImageType(image)}" length="0" />
      <media:content url="${escapeXml(image)}" medium="image" type="${guessImageType(image)}" />
      <media:thumbnail url="${escapeXml(image)}" />`
        : '';

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <author>${escapeXml(author)}</author>
      <category>${escapeXml(category)}</category>
      <description>${cdata(description)}</description>
      <content:encoded>${cdata(encoded)}</content:encoded>${media}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>5</ttl>
    <managingEditor>${escapeXml(DEFAULT_AUTHOR)}</managingEditor>
    <copyright>${escapeXml(`© ${new Date().getUTCFullYear()} cybersentry360. Published by Quore B2B Marketing.`)}</copyright>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export const RSS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const;
