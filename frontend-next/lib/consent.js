/** First-party cookie consent + analytics payload helpers for cybersentry360. */

export const CONSENT_COOKIE = 'cybersentry360_consent';
export const VID_COOKIE = 'cybersentry360_vid';
export const ATTR_COOKIE = 'cybersentry360_attr';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const VID_MAX_AGE_DAYS = 400;
export const ATTR_MAX_AGE_DAYS = 90;
export const CONSENT_EVENT = 'cookie-consent-updated';
export const OPEN_PREFS_EVENT = 'open-cookie-preferences';
/** Alias used by some Compare Bazaar-style triggers */
export const OPEN_PREFS_EVENT_ALT = 'cookie-consent-open';

const DAY = 86400;
const ANALYTICS_ENABLED =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_ANALYTICS !== 'false'
    : true;

const ANALYTICS_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_ANALYTICS_URL) ||
  '/api/public/site-analytics/event';

export function defaultConsent() {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

function isSecure() {
  if (typeof window === 'undefined') return true;
  return window.location.protocol === 'https:';
}

export function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

export function writeCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    'SameSite=Lax',
  ];
  if (isSecure()) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (isSecure()) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function parseConsent(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (Number(data.version) !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: !!data.analytics,
      marketing: !!data.marketing,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function getConsent() {
  return parseConsent(readCookie(CONSENT_COOKIE));
}

export function hasConsentDecision() {
  return !!getConsent();
}

function randomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let out = '';
  const bytes =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(24))
      : Array.from({ length: 24 }, () => Math.floor(Math.random() * 256));
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export function ensureVisitorId() {
  const existing = readCookie(VID_COOKIE);
  if (existing && /^[a-zA-Z0-9_-]{12,64}$/.test(existing)) return existing;
  const id = randomId();
  writeCookie(VID_COOKIE, id, VID_MAX_AGE_DAYS * DAY);
  return id;
}

function readUtms() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const out = {};
  for (const key of keys) {
    const val = params.get(key);
    if (val) out[key] = val.slice(0, 120);
  }
  return out;
}

function extractEmailDomainFromSearch() {
  if (typeof window === 'undefined') return { hint: false, domain: '' };
  const q = window.location.search || '';
  const match = q.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (!match) return { hint: false, domain: '' };
  return { hint: true, domain: match[1].toLowerCase().slice(0, 120) };
}

export function ensureAttribution() {
  const existing = readCookie(ATTR_COOKIE);
  if (existing) return existing;

  if (typeof window === 'undefined') return null;

  const utms = readUtms();
  const payload = {
    landing: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    referrer: (document.referrer || '').slice(0, 300),
    utm_source: utms.utm_source || '',
    utm_medium: utms.utm_medium || '',
    utm_campaign: utms.utm_campaign || '',
    utm_term: utms.utm_term || '',
    utm_content: utms.utm_content || '',
    capturedAt: new Date().toISOString(),
  };

  const value = JSON.stringify(payload);
  writeCookie(ATTR_COOKIE, value, ATTR_MAX_AGE_DAYS * DAY);
  return value;
}

function parseAttr() {
  try {
    const raw = readCookie(ATTR_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function viewportBucket(width) {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  return 'xl';
}

function deviceCategory(width) {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/** Build marketing / device / UTM payload for analytics ingest. */
export function buildMarketingPayload(consent) {
  if (typeof window === 'undefined') return {};

  const utms = readUtms();
  const email = extractEmailDomainFromSearch();
  const width = window.innerWidth || 0;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const languages = Array.isArray(navigator.languages) ? navigator.languages : [];
  let referrerHost = '';
  try {
    if (document.referrer) referrerHost = new URL(document.referrer).hostname;
  } catch {
    /* ignore */
  }

  const payload = {
    locale: navigator.language || '',
    deviceCategory: deviceCategory(width),
    viewportWidth: width,
    viewportBucket: viewportBucket(width),
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    pixelRatio: window.devicePixelRatio || 1,
    platform: navigator.platform || '',
    primaryLanguage: navigator.language || '',
    languagesLabel: languages.slice(0, 5).join(',').slice(0, 120),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    connectionEffectiveType: conn?.effectiveType || '',
    connectionDownlink: typeof conn?.downlink === 'number' ? conn.downlink : undefined,
    referrerHost,
    utmSource: utms.utm_source || '',
    utmMedium: utms.utm_medium || '',
    utmCampaign: utms.utm_campaign || '',
    utmContent: utms.utm_content || '',
    utmTerm: utms.utm_term || '',
    emailPrefillHint: email.hint,
    emailPrefillDomain: email.domain,
  };

  if (consent?.marketing) {
    const attr = parseAttr();
    if (attr) {
      payload.ftSource = attr.utm_source || '';
      payload.ftMedium = attr.utm_medium || '';
      payload.ftCampaign = attr.utm_campaign || '';
      payload.ftContent = attr.utm_content || '';
      payload.ftTerm = attr.utm_term || '';
      payload.ftLandingPath = attr.landing || '';
      payload.ftAt = attr.capturedAt || '';
    }
  }

  return payload;
}

export function postSiteAnalyticsEvent({ kind, consent, customMeta, choice, consentId }) {
  if (typeof window === 'undefined') return;
  if (!ANALYTICS_ENABLED) return;

  const sessionId = ensureVisitorId();
  const path = `${window.location.pathname}${window.location.search}`.slice(0, 500);
  const marketing = buildMarketingPayload(consent);
  if (choice) marketing.choice = choice;
  if (consentId) marketing.consentId = consentId;

  const body = JSON.stringify({
    kind,
    sessionId,
    path,
    referrer: (document.referrer || '').slice(0, 500),
    consent: {
      analytics: !!consent?.analytics,
      marketing: !!consent?.marketing,
    },
    consentedDomain: window.location.hostname,
    marketing,
    customMeta: customMeta || undefined,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ANALYTICS_URL, blob);
      return;
    }
    fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function saveConsent({ analytics, marketing, choice }) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: !!analytics,
    marketing: !!marketing,
    updatedAt: new Date().toISOString(),
  };

  writeCookie(CONSENT_COOKIE, JSON.stringify(consent), CONSENT_MAX_AGE_DAYS * DAY);

  // Stable visitor id for consent audit + optional page_view sessions
  ensureVisitorId();

  if (consent.marketing) {
    ensureAttribution();
  } else {
    deleteCookie(ATTR_COOKIE);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
    const resolved = resolveChoice(choice, consent.analytics, consent.marketing);
    postSiteAnalyticsEvent({
      kind: 'consent',
      consent,
      choice: resolved,
      consentId: randomId().slice(0, 16),
    });
  }

  return consent;
}

function resolveChoice(choice, analytics, marketing) {
  if (choice === 'accept_all' || choice === 'reject_all' || choice === 'custom') return choice;
  if (analytics && marketing) return 'accept_all';
  if (!analytics && !marketing) return 'reject_all';
  return 'custom';
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT_ALT));
}

/** Apply Google Consent Mode update from a consent object. */
export function applyGoogleConsent(consent) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const granted = !!consent?.analytics;
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });
}
