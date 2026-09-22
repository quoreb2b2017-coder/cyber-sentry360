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
              you choose. Manage choices anytime from the footer link{' '}
              <strong>Cookie preferences</strong>.
            </p>

            <div className="space-y-4 not-prose">
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Strictly necessary</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Always on. Used for security, storing your cookie consent decision, and basic site navigation.
                  Cookie: <code className="font-mono text-xs">cybersentry360_consent</code>.
                </p>
              </div>
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Analytics</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Optional. Anonymous page-view measurement and Google Analytics (Consent Mode) only when you allow
                  it. May set <code className="font-mono text-xs">cybersentry360_vid</code> as an anonymous visitor id.
                  Before consent, Google storage defaults to denied.
                </p>
              </div>
              <div className="brutal-border p-4 bg-card">
                <h3 className="font-heading font-bold uppercase text-sm tracking-tight mb-1">Marketing / attribution</h3>
                <p className="text-sm text-foreground/85 leading-snug">
                  Optional. First-touch landing path and UTM attribution for campaign measurement when allowed.
                  Cookie: <code className="font-mono text-xs">cybersentry360_attr</code> (~90 days). We do not store
                  full email addresses in cookies.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Your choices
            </h2>
            <p>
              You can accept all cookies, reject non-essential cookies, or customize categories. Changing marketing
              off deletes attribution cookies; turning analytics off denies Google Consent Mode storage and removes
              the anonymous visitor id.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-black uppercase text-xl tracking-tight border-b-2 border-foreground pb-2 mb-3">
              Contact
            </h2>
            <p>
              Questions about this policy: reach Quore B2B Marketing via the channels listed on your engagement
              agreement, or use the site contact path provided by your account manager.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
