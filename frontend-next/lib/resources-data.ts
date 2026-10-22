import { getAdminClient } from '@/lib/supabase/admin';
import {
  UPLOAD_CATEGORIES,
  VERTICALS,
  defaultFormConfig,
  fieldOption,
  isOptOutCopy,
  publicConsent,
  publicStepFields,
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

function cleanConsentBlock(input: unknown, fallback: { text: string; visible: boolean }, required: boolean) {
  const row = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    text: String(row.text ?? fallback.text).slice(0, 800),
    visible: row.visible !== false,
    required,
  };
}

function cleanFormConfig(input: unknown) {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const defaults = defaultFormConfig().consent;
  const rawFields = Array.isArray(src.fields) ? src.fields : null;
  const seen = new Set<string>();
  const fields = rawFields
    ? rawFields.slice(0, 12).map((f) => {
        const row = f && typeof f === 'object' ? (f as Record<string, unknown>) : {};
        const option = fieldOption(String(row.key || ''));
        if (!option || seen.has(option.key)) return null;
        seen.add(option.key);
        return {
          label: option.label,
          key: option.key,
          type: option.type,
          required: row.required !== false,
        };
      }).filter(Boolean)
    : null;

  const consentIn = src.consent && typeof src.consent === 'object' ? (src.consent as Record<string, unknown>) : {};
  const modern = consentIn.terms || consentIn.partners || consentIn.optOut;
  const extra = Array.isArray(consentIn.extra) ? consentIn.extra.slice(0, 8) : [];
  const questions = Array.isArray(src.questions) ? src.questions.slice(0, 20) : [];

  return {
    fields,
    consent: {
      emailNote: String(consentIn.emailNote ?? defaults.emailNote).slice(0, 400),
      terms: cleanConsentBlock(modern ? consentIn.terms : defaults.terms, defaults.terms, true),
      partners: cleanConsentBlock(modern ? consentIn.partners : defaults.partners, defaults.partners, true),
      optOut: cleanConsentBlock(modern ? consentIn.optOut : defaults.optOut, defaults.optOut, false),
      extra: extra.map((c) => {
        const row = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
        const text = String(row.text || '').slice(0, 800);
        return {
          text,
          required: isOptOutCopy(text) ? false : !!row.required,
        };
      }).filter((c) => c.text),
      footerLine: String(consentIn.footerLine ?? defaults.footerLine).slice(0, 400),
    },
    questions: questions.map((q) => {
      const row = q && typeof q === 'object' ? (q as Record<string, unknown>) : {};
      const options = (Array.isArray(row.options) ? row.options : String(row.optionsText || '').split('\n'))
        .map((o) => String(o).trim())
        .filter(Boolean)
        .slice(0, 20);
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
      fields: publicStepFields(form),
      consent: publicConsent(form),
    },
  };
}

export { cleanFormConfig };
