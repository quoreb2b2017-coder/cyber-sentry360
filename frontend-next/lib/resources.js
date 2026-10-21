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
  { slug: 'guide', label: 'Guide' },
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
    href: '/resources/whitepapers?type=whitepaper',
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
    category: 'guide',
    badge: 'Guides',
    heading: 'Guides',
    paragraph: 'Practical guides published with the Guide category. The page stays on Coming soon until one is saved.',
    pillars: ['Coming soon', 'Not filled with blogs', 'Published guides only'],
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

export const DEFAULT_DOWNLOAD_FIELDS = [
  { label: 'Zip/Postal Code', key: 'zip', type: 'text', required: true },
  { label: 'Phone', key: 'phone', type: 'tel', required: true },
];

export function defaultFormConfig() {
  return {
    fields: null,
    explicitEmptyFields: false,
    consent: {
      emailNote: `We email this download from ${SITE_NAME}. You can unsubscribe at any time.`,
      checks: [
        { text: 'I agree to receive this download by email.', required: true, visible: true },
        { text: `I agree to the {${SITE_NAME} Privacy Policy}.`, href: '/privacy', required: true, visible: true },
        { text: `${SITE_NAME} may contact me about related research.`, required: true, visible: true },
      ],
      extra: [],
      footerLine: `Brought to you through ${SITE_NAME}.`,
      showEmailNote: true,
      showChecks: true,
      showFooter: true,
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
  const category = map[section];
  return RESOURCE_MENU.find((s) => s.category === category) || null;
}

export function publicFields(formConfig) {
  const cfg = formConfig && typeof formConfig === 'object' ? formConfig : {};
  if (Array.isArray(cfg.fields) && cfg.fields.length > 0) {
    return cfg.fields
      .filter((f) => f && f.label && f.key)
      .map((f) => ({
        label: String(f.label).slice(0, 80),
        key: String(f.key).slice(0, 40),
        type: ['text', 'tel', 'email'].includes(f.type) ? f.type : 'text',
        required: f.required !== false,
      }));
  }
  if (cfg.explicitEmptyFields) return [];
  return DEFAULT_DOWNLOAD_FIELDS;
}

function safeHref(href) {
  const value = String(href || '').trim();
  if (value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://')) return value;
  return '';
}

/** `{words}` uses href. `{words|/privacy}` carries its own URL. `[words](/privacy)` still works. */
export function consentParts(text, href) {
  const raw = String(text || '');
  const fallback = safeHref(href) || '/privacy';
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\{([^{}|]+)\|([^{}]+)\}|\{([^{}]+)\}/g;
  const chunks = [];
  let last = 0;
  let match;
  while ((match = re.exec(raw))) {
    if (match.index > last) chunks.push({ type: 'text', value: raw.slice(last, match.index) });
    if (match[1]) {
      const linkHref = safeHref(match[2]);
      chunks.push(linkHref ? { type: 'link', label: match[1], href: linkHref } : { type: 'text', value: match[1] });
    } else if (match[3]) {
      const linkHref = safeHref(match[4]);
      chunks.push(linkHref ? { type: 'link', label: match[3], href: linkHref } : { type: 'text', value: match[3] });
    } else {
      chunks.push({ type: 'link', label: match[5], href: fallback });
    }
    last = match.index + match[0].length;
  }
  if (last < raw.length) chunks.push({ type: 'text', value: raw.slice(last) });

  return chunks.flatMap((part) => {
    if (part.type !== 'text' || !/privacy policy/i.test(part.value)) return [part];
    const bits = part.value.split(/(Privacy Policy)/i);
    return bits.filter(Boolean).map((bit) => (
      /^privacy policy$/i.test(bit)
        ? { type: 'link', label: bit, href: fallback }
        : { type: 'text', value: bit }
    ));
  });
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
