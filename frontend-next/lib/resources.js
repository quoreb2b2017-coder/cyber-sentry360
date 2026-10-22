/** Resources library for cybersentry360. Resource types are fixed. */

export const SITE_NAME = 'cybersentry360';

/** Public vertical labels. Cards must use these strings exactly. */
export const VERTICALS = [
  { slug: 'ai', label: 'AI' },
  { slug: 'cybersecurity', label: 'Cybersecurity' },
  { slug: 'threats', label: 'Threats' },
  { slug: 'policy', label: 'Policy' },
  { slug: 'cloud', label: 'Cloud' },
  { slug: 'data', label: 'Data' },
];

export const UPLOAD_CATEGORIES = [
  { slug: 'whitepaper', label: 'White paper' },
  { slug: 'report', label: 'Report' },
  { slug: 'case_study', label: 'Case study' },
  { slug: 'webinar', label: 'Webinar' },
];

/** Public Resources menu. Do not reorder or add types. */
export const RESOURCE_MENU = [
  {
    key: 'blogs',
    number: '01',
    label: 'Blogs',
    href: '/blog',
    category: null,
    badge: 'Editorial',
    heading: 'Blogs',
    paragraph: 'Reporting and analysis from the cybersentry360 desks. These are articles, not PDF downloads.',
    pillars: ['Desk reporting', 'Builder and CISO briefings', 'No PDF gate'],
  },
  {
    key: 'whitepaper',
    number: '02',
    label: 'White papers',
    href: '/resources/whitepapers',
    path: '/resources/whitepapers',
    category: 'whitepaper',
    badge: 'White papers',
    heading: 'White papers',
    paragraph: 'Longer research you can download after a short form. Filed only when the category is White paper.',
    pillars: ['Original research', 'Download form', 'One vertical each'],
  },
  {
    key: 'report',
    number: '03',
    label: 'Reports',
    href: '/resources/reports',
    path: '/resources/reports',
    category: 'report',
    badge: 'Reports',
    heading: 'Reports',
    paragraph: 'Findings and briefings published as reports. This page lists the Report category only.',
    pillars: ['Findings', 'Vertical filter', 'Gated PDF'],
  },
  {
    key: 'case_study',
    number: '04',
    label: 'Case studies',
    href: '/resources/case-studies',
    path: '/resources/case-studies',
    category: 'case_study',
    badge: 'Case studies',
    heading: 'Case studies',
    paragraph: 'How teams handled a specific security problem. Only Case study uploads appear here.',
    pillars: ['Real scenarios', 'Named vertical', 'Download form'],
  },
  {
    key: 'guide',
    number: '05',
    label: 'Guides',
    href: '/resources/guides',
    path: '/resources/guides',
    badge: 'Guides',
    heading: 'Guides',
    category: null,
    paragraph: 'Guides are not a download type. This page stays on Coming soon. Blog posts are not listed here.',
    pillars: ['Coming soon', 'No guide upload', 'Blogs stay in Blogs'],
  },
  {
    key: 'webinar',
    number: '06',
    label: 'Webinars',
    href: '/resources/webinars',
    path: '/resources/webinars',
    category: 'webinar',
    badge: 'Webinars',
    heading: 'Webinars',
    paragraph: 'Session notes and decks from the Webinar category. Other uploads stay off this page.',
    pillars: ['Session material', 'Same upload form', 'Webinar category only'],
  },
];

export const DOWNLOAD_FIELD_OPTIONS = [
  { key: 'zip', label: 'Zip/Postal Code', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'first_name', label: 'First name', type: 'text' },
  { key: 'last_name', label: 'Last name', type: 'text' },
  { key: 'job_title', label: 'Job title', type: 'text' },
  { key: 'street', label: 'Street address', type: 'text' },
  { key: 'suite', label: 'Suite / office', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State / province', type: 'text' },
  { key: 'country', label: 'Country', type: 'text' },
];

export const DEFAULT_DOWNLOAD_FIELDS = [
  { label: 'Zip/Postal Code', key: 'zip', type: 'text', required: true },
  { label: 'Phone', key: 'phone', type: 'tel', required: true },
];

const PERSONAL_INBOXES = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'proton.me', 'protonmail.com', 'pm.me',
  'gmx.com', 'gmx.net', 'mail.com', 'inbox.com',
]);

export function defaultFormConfig() {
  return {
    fields: null,
    consent: {
      emailNote: 'Company email only. Not Gmail, Yahoo, Outlook, or other personal addresses.',
      terms: {
        text: `I agree to ${SITE_NAME}'s {{terms}}, {{privacy}}, and the transfer of my information to the United States for processing to provide me with relevant information as described in our {{privacy}}.`,
        visible: true,
        required: true,
      },
      partners: {
        text: `I agree to my information being processed by ${SITE_NAME} and its partners to contact me via phone, email or other means regarding information relevant to my professional interests. I may {{unsubscribe}} at any time.`,
        visible: true,
        required: true,
      },
      optOut: {
        text: `**Optional:** check this box only if you want to **opt out of further emails** from ${SITE_NAME}. Leave it unchecked to keep receiving relevant updates. Read our {{privacy-statement}}.`,
        visible: true,
        required: false,
      },
      extra: [],
      footerLine: 'I have read and understood privacy statement of {{publisher}}.',
    },
    questions: [],
  };
}

export function verticalLabel(slug) {
  return VERTICALS.find((v) => v.slug === slug)?.label || slug || '';
}

export function sectionByCategory(category) {
  return RESOURCE_MENU.find((s) => s.category === category) || null;
}

export function sectionByPath(section) {
  const map = {
    whitepapers: 'whitepaper',
    reports: 'report',
    'case-studies': 'case_study',
    guides: 'guide',
    webinars: 'webinar',
  };
  const key = map[section];
  return RESOURCE_MENU.find((s) => s.key === key) || null;
}

export function fieldOption(key) {
  return DOWNLOAD_FIELD_OPTIONS.find((option) => option.key === key) || null;
}

export function savedDownloadFields(formConfig) {
  const cfg = formConfig && typeof formConfig === 'object' ? formConfig : {};
  if (!Array.isArray(cfg.fields)) return DEFAULT_DOWNLOAD_FIELDS.map((field) => ({ ...field }));
  const seen = new Set();
  const fields = [];
  cfg.fields.slice(0, 12).forEach((field) => {
    const option = fieldOption(field && field.key);
    if (!option || seen.has(option.key)) return;
    seen.add(option.key);
    fields.push({
      key: option.key,
      label: option.label,
      type: option.type,
      required: field.required !== false,
    });
  });
  return fields;
}

/** Step 2 fields after the always-on first and last name. */
export function publicStepFields(formConfig) {
  return savedDownloadFields(formConfig).filter((field) => field.key !== 'first_name' && field.key !== 'last_name');
}

export function publicFields(formConfig) {
  return publicStepFields(formConfig);
}

export function isOptOutCopy(text) {
  return /\bopt[\s-]*out\b/i.test(String(text || ''));
}

function consentBlock(source, key, fallback, required) {
  const row = source && source[key] && typeof source[key] === 'object' ? source[key] : fallback;
  return {
    text: String(row.text || fallback.text || ''),
    visible: row.visible !== false,
    required,
  };
}

export function publicConsent(formConfig) {
  const cfg = formConfig && typeof formConfig === 'object' ? formConfig : {};
  const defaults = defaultFormConfig().consent;
  const saved = cfg.consent && typeof cfg.consent === 'object' ? cfg.consent : {};
  const modern = saved.terms || saved.partners || saved.optOut;
  const source = modern ? saved : defaults;
  const terms = consentBlock(source, 'terms', defaults.terms, true);
  const partners = consentBlock(source, 'partners', defaults.partners, true);
  const optOut = consentBlock(source, 'optOut', defaults.optOut, false);
  const extra = Array.isArray(source.extra) ? source.extra : [];
  const checks = [];
  if (terms.visible && terms.text) checks.push({ id: 'terms', text: terms.text, required: true, optOut: false });
  if (partners.visible && partners.text) checks.push({ id: 'partners', text: partners.text, required: true, optOut: false });
  if (optOut.visible && optOut.text) checks.push({ id: 'optOut', text: optOut.text, required: false, optOut: true });
  extra.slice(0, 8).forEach((row, index) => {
    const text = String(row?.text || '').trim();
    if (!text) return;
    const optOutCopy = isOptOutCopy(text);
    checks.push({ id: `extra-${index}`, text, required: optOutCopy ? false : !!row.required, optOut: optOutCopy });
  });
  return {
    emailNote: String(source.emailNote || defaults.emailNote),
    checks,
    footerLine: String(source.footerLine || defaults.footerLine),
  };
}

export function isPersonalEmail(email) {
  const domain = String(email || '').toLowerCase().trim().split('@')[1] || '';
  if (!domain || !domain.includes('.')) return true;
  if (PERSONAL_INBOXES.has(domain)) return true;
  const host = domain.split('.')[0];
  return ['yahoo', 'hotmail', 'outlook', 'live', 'aol', 'gmx'].includes(host);
}

const CONSENT_TOKENS = {
  terms: { label: 'Terms of Use', href: '/terms' },
  privacy: { label: 'Privacy Policy', href: '/privacy' },
  'privacy-statement': { label: 'privacy statement', href: '/privacy' },
  unsubscribe: { label: 'unsubscribe', href: '/unsubscribe' },
};

/** {{terms}} {{privacy}} {{privacy-statement}} {{unsubscribe}} {{publisher}} and **bold**. */
export function consentParts(text) {
  const raw = String(text || '').replaceAll('{{publisher}}', SITE_NAME).replaceAll('Compare Bazaar', SITE_NAME);
  const re = /\{\{([a-z0-9-]+)\}\}|\*\*([^*]+)\*\*/g;
  const chunks = [];
  let last = 0;
  let match;
  while ((match = re.exec(raw))) {
    if (match.index > last) chunks.push({ type: 'text', value: raw.slice(last, match.index) });
    if (match[1]) {
      const token = CONSENT_TOKENS[match[1]];
      chunks.push(token ? { type: 'link', label: token.label, href: token.href } : { type: 'text', value: match[0] });
    } else {
      chunks.push({ type: 'bold', value: match[2] });
    }
    last = match.index + match[0].length;
  }
  if (last < raw.length) chunks.push({ type: 'text', value: raw.slice(last) });
  return chunks;
}

export function slugifyResource(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
