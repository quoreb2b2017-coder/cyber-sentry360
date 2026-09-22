import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { getSiteUrl } from '@/lib/seo/site-url';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How cybersentry360 collects, uses, and stores data — including cookie categories, analytics, and marketing preferences.',
  alternates: {
    canonical: `${getSiteUrl()}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-[800px] mx-auto px-5 py-10 md:py-14" data-testid="privacy-page">
        <header className="border-b-2 border-foreground pb-6 mb-8">
          <div className="overline text-primary mb-2">Legal</div>
          <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter leading-none">
            Privacy Policy
          </h1>
          <p className="mt-4 font-serif italic text-lg text-muted-foreground">
            Last updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            Published by Quore B2B Marketing.
          </p>
        </header>

        <div className="prose-editorial space-y-8 text-[1.05rem] leading-relaxed">
          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Who we are
            </h2>
            <p>
              cybersentry360 (<Link href="/" className="text-primary underline">www.cybersentry360.com</Link>) is an
              AI &amp; cybersecurity editorial site operated by Quore B2B Marketing. This policy explains what we
              collect when you browse, subscribe, or interact with the site.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Newsletter
            </h2>
            <p>
              If you subscribe to the weekly brief, we store your email address so we can send issues and process
              unsubscribe requests. We do not sell subscriber lists. You can leave anytime via{' '}
              <Link href="/unsubscribe" className="text-primary underline">
                Unsubscribe
              </Link>
              .
            </p>
          </section>

          <section id="cookies">
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Cookies
            </h2>
            <p className="mb-4">
              We use a first-party consent cookie and optional category cookies. Non-essential cookies are off until
              you choose. The site remains usable without accepting analytics or marketing. Manage choices anytime
              from the footer link <strong>Cookie preferences</strong>.
            </p>

            <div className="space-y-4 not-prose">
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Strictly necessary</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Always on. Used for security, storing your cookie consent decision, and basic site navigation.
                  Cookie: <code className="font-mono text-xs">cybersentry360_consent</code> (~180 days). An anonymous
                  visitor id (<code className="font-mono text-xs">cybersentry360_vid</code>, ~400 days) may be set so
                  we can record your consent choice without identifying you as a logged-in user.
                </p>
              </div>
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Analytics</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Optional. Powers first-party page-view measurement on our servers and, when configured, Google
                  Analytics 4 with Consent Mode. Before you allow analytics, Google storage defaults to denied and we
                  do not send page_view events. We never store full email addresses in analytics — if a URL contains an
                  email, we keep only the domain hint (for example <code className="font-mono text-xs">gmail.com</code>).
                </p>
              </div>
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Marketing / attribution</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Optional. First-touch landing path and UTM attribution for campaign measurement when allowed.
                  Cookie: <code className="font-mono text-xs">cybersentry360_attr</code> (~90 days). Turning marketing
                  off deletes this cookie immediately.
                </p>
              </div>
            </div>
          </section>

          <section id="analytics-processing">
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              First-party analytics &amp; IP processing
            </h2>
            <p>
              When analytics consent is granted, we record anonymous events such as path, truncated referrer, device
              and locale hints, UTMs (if present), and approximate location from edge/CDN headers when available
              (country, city, region). For consent audit records we store a <strong>pseudonymized</strong> IP address
              (IPv4 last octet zeroed; IPv6 truncated). Browser time zone may be captured from your device. Events are
              retained for about <strong>180 days</strong>, then deleted to minimize retention.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Your choices
            </h2>
            <p>
              You can accept all cookies, reject non-essential cookies, or customize categories. Changing marketing
              off deletes attribution cookies; turning analytics off keeps Google Consent Mode denied and stops
              first-party page_view beacons. Re-open preferences anytime via the footer.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              International / cross-border processing
            </h2>
            <p>
              Our hosting and analytics tooling may process data in the United States or other regions where our
              providers operate. Where Google Analytics is enabled and you have granted analytics consent, Google may
              process measurement data under its terms. We do not sell personal information. Advertising or “sale”
              language on other Quore properties refers to advertising cookies — this site’s marketing category is
              limited to first-party attribution, not a sale of your data.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Privacy requests / contact
            </h2>
            <p>
              For access, deletion, or other privacy requests, contact Quore B2B Marketing via the channels listed on
              your engagement agreement, or email the privacy contact provided by your account manager. Include enough
              detail for us to locate relevant records (we do not use analytics as a login identity).
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
