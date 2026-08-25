/**
 * Build-time sitemap → public/sitemap/sitemap.xml (CDN static, GSC-friendly path).
 * Indexable URLs only: home, desks, published articles. No /tag/ archives.
 * Requires NEXT_PUBLIC_SUPABASE_* on Vercel; keeps existing file if env/DB unavailable.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PRODUCTION_SITE = 'https://www.cybersentry360.com';
const DESK_SLUGS = ['ai', 'cybersecurity', 'threats', 'policy', 'cloud', 'data'];
const publicOut = resolve(root, 'public', 'sitemap', 'sitemap.xml');

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (process.env.VERCEL === '1') {
    if (!raw || raw.includes('localhost') || raw.includes('127.0.0.1') || raw.includes('your-domain')) {
      return PRODUCTION_SITE;
    }
  }
  if (raw && !raw.includes('localhost') && !raw.includes('127.0.0.1')) {
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    return url.replace(/\/+$/, '');
  }
  return PRODUCTION_SITE;
}

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(root, name), 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        const k = t.slice(0, i).trim();
        const v = t.slice(i + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      // optional
    }
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastMod(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function uniquePosts(posts) {
  const seen = new Set();
  const out = [];
  for (const post of posts || []) {
    const slug = String(post?.slug || '')
      .trim()
      .replace(/^\/+|\/+$/g, '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...post, slug });
  }
  return out;
}

function buildXml(SITE_URL, posts) {
  const today = new Date().toISOString().slice(0, 10);
  const list = uniquePosts(posts);
  const homeLastmod = list[0] ? toLastMod(list[0].updated_at || list[0].published_at) : today;

  const entries = [
    urlEntry(SITE_URL, homeLastmod, 'daily', '1.0'),
    ...DESK_SLUGS.map((slug) => {
      const deskPosts = list.filter((p) => p.category === slug);
      const lastmod = deskPosts[0]
        ? toLastMod(deskPosts[0].updated_at || deskPosts[0].published_at)
        : today;
      return urlEntry(`${SITE_URL}/category/${slug}`, lastmod, 'daily', '0.85');
    }),
    ...list.map((post) =>
      urlEntry(
        `${SITE_URL}/article/${post.slug}`,
        toLastMod(post.updated_at || post.published_at),
        'weekly',
        '0.9'
      )
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

function assertValidSitemap(xml, siteUrl, postCount) {
  if (xml.includes('localhost') || xml.includes('127.0.0.1')) {
    throw new Error('Refusing to write sitemap with localhost URLs.');
  }
  if (xml.includes('/tag/')) {
    throw new Error('Refusing to write sitemap with /tag/ URLs.');
  }
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (new Set(locs).size !== locs.length) {
    throw new Error('Sitemap contains duplicate <loc> URLs.');
  }
  const expected = 1 + DESK_SLUGS.length + postCount;
  if (locs.length !== expected) {
    throw new Error(`Sitemap URL count ${locs.length} != expected ${expected}.`);
  }
  const bad = locs.find((loc) => !loc.startsWith(`${siteUrl}/`) && loc !== siteUrl);
  if (bad) {
    throw new Error(`Sitemap loc is not on ${siteUrl}: ${bad}`);
  }
}

async function main() {
  loadEnv();
  const SITE_URL = resolveSiteUrl();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (existsSync(publicOut)) {
      console.warn('Supabase env missing — keeping existing public/sitemap/sitemap.xml');
      return;
    }
    const fallback = buildXml(SITE_URL, []);
    writeFileSync(publicOut, fallback, 'utf8');
    console.warn('Supabase env missing — wrote minimal sitemap (static pages only)');
    return;
  }

  let posts = [];
  try {
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await db
      .from('posts')
      .select('slug, category, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    posts = uniquePosts(data || []);
  } catch (err) {
    if (existsSync(publicOut)) {
      console.warn('Supabase fetch failed — keeping existing public/sitemap/sitemap.xml:', err.message || err);
      return;
    }
    console.warn('Supabase fetch failed — writing minimal sitemap:', err.message || err);
    posts = [];
  }

  const xml = buildXml(SITE_URL, posts);
  assertValidSitemap(xml, SITE_URL, posts.length);

  mkdirSync(dirname(publicOut), { recursive: true });
  writeFileSync(publicOut, xml, 'utf8');
  const count = (xml.match(/<url>/g) || []).length;
  console.log(`Wrote ${publicOut} (${count} URLs) for ${SITE_URL}`);
  console.log(`  home: 1 · desks: ${DESK_SLUGS.length} · articles: ${posts.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
