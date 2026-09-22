/** First-party cookie consent helpers for cybersentry360 (GDPR/CCPA-friendly). */

export const CONSENT_COOKIE = 'cybersentry360_consent';
export const VID_COOKIE = 'cybersentry360_vid';
export const ATTR_COOKIE = 'cybersentry360_attr';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const ATTR_MAX_AGE_DAYS = 90;
export const CONSENT_EVENT = 'cookie-consent-updated';
export const OPEN_PREFS_EVENT = 'open-cookie-preferences';

const DAY = 86400;

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

export function saveConsent({ analytics, marketing, choice }) {
  const consent = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: !!analytics,
    marketing: !!marketing,
    updatedAt: new Date().toISOString(),
  };

  writeCookie(CONSENT_COOKIE, JSON.stringify(consent), CONSENT_MAX_AGE_DAYS * DAY);

  if (consent.analytics) {
    ensureVisitorId();
  } else {
    deleteCookie(VID_COOKIE);
  }

  if (consent.marketing) {
    ensureAttribution();
  } else {
    deleteCookie(ATTR_COOKIE);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
    logConsentToServer({
      choice: resolveChoice(choice, consent.analytics, consent.marketing),
      analytics: consent.analytics,
      marketing: consent.marketing,
      version: CONSENT_VERSION,
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

function logConsentToServer(payload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/consent', blob);
      return;
    }
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore logging failures */
  }
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFS_EVENT));
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `vid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureVisitorId() {
  const existing = readCookie(VID_COOKIE);
  if (existing) return existing;
  const id = randomId();
  writeCookie(VID_COOKIE, id, CONSENT_MAX_AGE_DAYS * DAY);
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

export function ensureAttribution() {
  const existing = readCookie(ATTR_COOKIE);
  if (existing) return existing;

  if (typeof window === 'undefined') return null;

  const payload = {
    landing: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    referrer: (document.referrer || '').slice(0, 300),
    ...readUtms(),
    capturedAt: new Date().toISOString(),
  };

  const value = JSON.stringify(payload);
  writeCookie(ATTR_COOKIE, value, ATTR_MAX_AGE_DAYS * DAY);
  return value;
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
