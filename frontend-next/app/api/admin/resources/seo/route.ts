import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { generateWithClaude, resolveAnthropicModel } from '@/lib/anthropic';
import { SITE_NAME, UPLOAD_CATEGORIES, VERTICALS, slugifyResource } from '@/lib/resources';

export const dynamic = 'force-dynamic';

function asText(value: unknown, max: number) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Fill every SEO field with Claude. Does not publish or invent rankings. */
export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const category = UPLOAD_CATEGORIES.find((c) => c.slug === body.category)?.label || 'research PDF';
  const vertical = VERTICALS.find((v) => v.slug === body.vertical)?.label || '';
  if (!title) return NextResponse.json({ detail: 'Title is required' }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ detail: 'ANTHROPIC_API_KEY is missing' }, { status: 503 });
  }

  try {
    const { text } = await generateWithClaude({
      system: `You write on-page SEO for ${SITE_NAME}, an AI and cybersecurity editorial site. Return one JSON object only. Do not invent search volume, keyword difficulty, or rankings. Write real sentences an editor can publish.`,
      user: `Title: ${title}
Category: ${category}
Vertical: ${vertical || 'not set'}
Editor notes: ${description || 'none'}

Return JSON with all of these keys filled:
{
  "slug": "lowercase-hyphenated",
  "metaTitle": "50-60 characters",
  "metaDescription": "140-160 characters",
  "keywords": "6 comma-separated phrases",
  "overview": "2 short paragraphs",
  "description": "one sentence for the card",
  "insideSections": [
    {"heading":"...","body":"2-3 sentences"},
    {"heading":"...","body":"2-3 sentences"},
    {"heading":"...","body":"2-3 sentences"}
  ]
}`,
      maxTokens: 2200,
      temperature: 0.4,
    });

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return NextResponse.json({ detail: 'Claude did not return SEO JSON' }, { status: 502 });
    }
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const sections = Array.isArray(parsed.insideSections) ? parsed.insideSections : [];
    const insideSections = sections
      .slice(0, 3)
      .map((section) => {
        const row = section && typeof section === 'object' ? (section as Record<string, unknown>) : {};
        return { heading: asText(row.heading, 120), body: asText(row.body, 800) };
      })
      .filter((section) => section.heading || section.body);

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.map((k) => asText(k, 60)).filter(Boolean).join(', ')
      : asText(parsed.keywords, 300);

    return NextResponse.json({
      source: 'claude',
      model: resolveAnthropicModel(),
      slug: slugifyResource(asText(parsed.slug, 80) || title),
      metaTitle: asText(parsed.metaTitle || parsed.meta_title, 70) || title.slice(0, 70),
      metaDescription: asText(parsed.metaDescription || parsed.meta_description, 160),
      keywords,
      overview: asText(parsed.overview, 2000),
      description: asText(parsed.description, 240) || description,
      insideSections,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Claude request failed' },
      { status: 502 }
    );
  }
}
