import { getAdminClient } from '@/lib/supabase/admin';
import {
  UPLOAD_CATEGORIES,
  VERTICALS,
  publicFields,
  slugifyResource,
} from '@/lib/resources';

const LIST_COLUMNS =
  'id, title, description, offered_by, author, category, vertical, slug, cover_url, status, created_at, updated_at';

export function isUploadCategory(value: string) {
  return UPLOAD_CATEGORIES.some((c) => c.slug === value);
}

export function isVertical(value: string) {
  return VERTICALS.some((v) => v.slug === value);
}

export async function listResources(opts: { category?: string | null; status?: string | null } = {}) {
  const db = getAdminClient();
  let query = db.from('resources').select(LIST_COLUMNS).order('created_at', { ascending: false });
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, error } = await query.limit(200);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getResourceBySlug(slug: string) {
  const db = getAdminClient();
  const { data, error } = await db.from('resources').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getResourceById(id: string) {
  const db = getAdminClient();
  const { data, error } = await db.from('resources').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function safeConsentHref(href: unknown) {
  const value = String(href || '').trim().slice(0, 300);
  if (value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://')) return value;
  return '';
}

function cleanFormConfig(input: unknown) {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const explicitEmptyFields = !!src.explicitEmptyFields;
  const rawFields = Array.isArray(src.fields) ? src.fields : null;
  const fields =
    !rawFields || rawFields.length === 0
      ? null
      : rawFields.slice(0, 12).map((f) => {
            const row = f && typeof f === 'object' ? (f as Record<string, unknown>) : {};
            const type = row.type === 'tel' || row.type === 'email' ? row.type : 'text';
            return {
              label: String(row.label || '').slice(0, 80),
              key: slugifyResource(String(row.key || row.label || 'field')).replace(/-/g, '_') || 'field',
              type,
              required: row.required !== false,
            };
          }).filter((f) => f.label && f.key);

  const consentIn = src.consent && typeof src.consent === 'object' ? (src.consent as Record<string, unknown>) : {};
  const checks = Array.isArray(consentIn.checks) ? consentIn.checks.slice(0, 3) : [];
  const extra = Array.isArray(consentIn.extra) ? consentIn.extra.slice(0, 8) : [];
  const questions = Array.isArray(src.questions) ? src.questions.slice(0, 8) : [];

  return {
    fields: fields && fields.length ? fields : explicitEmptyFields ? [] : null,
    explicitEmptyFields: !!(explicitEmptyFields && !(fields && fields.length)),
    consent: {
      emailNote: String(consentIn.emailNote || '').slice(0, 400),
      checks: checks.map((c) => {
        const row = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
        return {
          text: String(row.text || '').slice(0, 240),
          href: safeConsentHref(row.href),
          required: !!row.required,
          visible: row.visible !== false,
        };
      }),
      extra: extra.map((c) => {
        const row = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
        return {
          text: String(row.text || '').slice(0, 240),
          href: safeConsentHref(row.href),
          required: !!row.required,
        };
      }).filter((c) => c.text),
      footerLine: String(consentIn.footerLine || '').slice(0, 240),
      showEmailNote: consentIn.showEmailNote !== false,
      showChecks: consentIn.showChecks !== false,
      showFooter: consentIn.showFooter !== false,
    },
    questions: questions.map((q) => {
      const row = q && typeof q === 'object' ? (q as Record<string, unknown>) : {};
      const options = Array.isArray(row.options)
        ? row.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 12)
        : String(row.optionsText || '')
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean)
            .slice(0, 12);
      return { question: String(row.question || '').slice(0, 200), options };
    }).filter((q) => q.question),
  };
}

export function toPublicResource(row: Record<string, unknown>) {
  const form = (row.form_config || {}) as Record<string, unknown>;
  return {
    ...row,
    form_config: {
      ...form,
      fields: publicFields(form),
    },
  };
}

export { cleanFormConfig };
