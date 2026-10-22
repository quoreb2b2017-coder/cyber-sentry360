import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { SITE_NAME } from '@/lib/resources';

export const metadata = {
  title: 'Terms of Use',
  description: `Terms of Use for ${SITE_NAME} research downloads.`,
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-[800px] px-5 py-10 md:py-14">
        <header className="mb-8 border-b-2 border-foreground pb-6">
          <div className="overline mb-2 text-primary">Legal</div>
          <h1 className="font-heading text-4xl font-black uppercase tracking-tighter md:text-5xl">Terms of Use</h1>
        </header>
        <div className="space-y-4 text-[1.05rem] leading-relaxed">
          <p>
            These terms cover use of {SITE_NAME}, including white papers, reports, case studies, and webinars you download from the site.
          </p>
          <p>
            A download asks for a company email and the details shown on that form. Required checkboxes must be ticked before the file is sent. The optional opt-out box is how you decline further research email.
          </p>
          <p>
            How we handle that information is described in the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. You can <Link href="/unsubscribe" className="text-primary underline">unsubscribe</Link> at any time.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
