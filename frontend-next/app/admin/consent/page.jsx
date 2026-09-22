import { redirect } from 'next/navigation';

/** Legacy path — GDPR consent lives at /admin/gdpr */
export default function AdminConsentRedirect() {
  redirect('/admin/gdpr');
}
