import { redirect } from 'next/navigation';

/** Legacy path — use Cookies & visitors report. */
export default function AdminConsentRedirect() {
  redirect('/admin/cookies-report');
}
