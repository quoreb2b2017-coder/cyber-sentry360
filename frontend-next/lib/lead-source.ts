const TYPES = new Set(['blog', 'whitepaper', 'report', 'case_study', 'guide', 'webinar', 'site']);

export type LeadSource = { type: string; slug: string; title: string };

export function readLeadSource(row: { source_type?: string | null; source_slug?: string | null; source_title?: string | null; unsubscribe_reason?: string | null }): LeadSource | null {
  if (row?.source_title || (row?.source_type && row.source_type !== 'site')) {
    return {
      type: String(row.source_type || 'site'),
      slug: String(row.source_slug || ''),
      title: String(row.source_title || ''),
    };
  }
  try {
    const parsed = JSON.parse(String(row?.unsubscribe_reason || ''));
    if (parsed && parsed.kind === 'lead-source') {
      return { type: String(parsed.type || 'site'), slug: String(parsed.slug || ''), title: String(parsed.title || '') };
    }
  } catch {
    /* plain unsubscribe note */
  }
  return null;
}

export function leadSourceLabel(source: LeadSource | null) {
  if (!source || source.type === 'site') return source?.title ? `Site · ${source.title}` : '';
  const names: Record<string, string> = {
    blog: 'Blog',
    whitepaper: 'White paper',
    report: 'Report',
    case_study: 'Case study',
    guide: 'Guide',
    webinar: 'Webinar',
  };
  const name = names[source.type] || 'Page';
  return source.title ? `${name} · ${source.title}` : name;
}

export async function resolveLeadSource(db: { from: (table: string) => any }, input: { sourceType?: unknown; sourceSlug?: unknown }): Promise<LeadSource> {
  const type = TYPES.has(String(input.sourceType || '')) ? String(input.sourceType) : 'site';
  const slug = String(input.sourceSlug || '').slice(0, 180).replace(/[^a-z0-9-_]/gi, '');
  let title = '';
  if (type === 'blog' && slug) {
    const { data } = await db.from('posts').select('title').eq('slug', slug).maybeSingle();
    title = data?.title || slug;
  } else if (type !== 'site' && slug) {
    const { data } = await db.from('resources').select('title').eq('slug', slug).maybeSingle();
    title = data?.title || slug;
  }
  return { type, slug, title: String(title).slice(0, 200) };
}

export async function saveLeadSource(db: { from: (table: string) => any }, email: string, source: LeadSource) {
  const probe = await db.from('newsletter_subscribers').select('source_type').limit(1);
  if (!probe.error) {
    const { error } = await db
      .from('newsletter_subscribers')
      .update({ source_type: source.type, source_slug: source.slug, source_title: source.title })
      .eq('email', email);
    return error?.message || null;
  }
  const { error } = await db
    .from('newsletter_subscribers')
    .update({ unsubscribe_reason: JSON.stringify({ kind: 'lead-source', ...source }) })
    .eq('email', email);
  return error?.message || null;
}
