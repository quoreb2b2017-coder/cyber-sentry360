import { createServerSupabaseClient } from './supabase/server';
import { getAdminClient } from './supabase/admin';

export async function getAuthUser(request?: Request) {
  const auth = request?.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const admin = getAdminClient();
    const { data: { user } } = await admin.auth.getUser(token);
    if (user) return user;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    /* cookie session unavailable */
  }

  return null;
}

export async function requireAdmin(request?: Request) {
  const user = await getAuthUser(request);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
