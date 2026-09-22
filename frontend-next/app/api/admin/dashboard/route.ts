import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAutomationSettings } from '@/lib/content/generator';
import { requireApiAuth } from '@/lib/api-auth';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const db = getAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalPosts },
    { count: published },
    { count: drafts },
    { count: failedJobs },
    { count: todayGenerated },
    { data: recentPosts },
    { data: recentLogs },
  ] = await Promise.all([
    db.from('posts').select('*', { count: 'exact', head: true }),
    db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('generation_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00`),
    db.from('posts').select('id, title, category, status, reading_time, created_at').order('created_at', { ascending: false }).limit(8),
    db.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(10),
  ]);

  const settings = await getAutomationSettings();

  let consent = {
    available: false,
    stats: {
      total: 0,
      acceptAll: 0,
      rejectAll: 0,
      custom: 0,
      analyticsOn: 0,
      marketingOn: 0,
      analyticsRate: 0,
      marketingRate: 0,
      acceptRate: 0,
    },
  };

  try {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: consentRows, error: consentError } = await db
      .from('consent_events')
      .select('choice, analytics, marketing')
      .gte('created_at', since30)
      .limit(5000);

    if (!consentError && consentRows) {
      const total = consentRows.length;
      const acceptAll = consentRows.filter((r) => r.choice === 'accept_all').length;
      const rejectAll = consentRows.filter((r) => r.choice === 'reject_all').length;
      const custom = consentRows.filter((r) => r.choice === 'custom').length;
      const analyticsOn = consentRows.filter((r) => r.analytics).length;
      const marketingOn = consentRows.filter((r) => r.marketing).length;
      consent = {
        available: true,
        stats: {
          total,
          acceptAll,
          rejectAll,
          custom,
          analyticsOn,
          marketingOn,
          analyticsRate: total ? Math.round((analyticsOn / total) * 100) : 0,
          marketingRate: total ? Math.round((marketingOn / total) * 100) : 0,
          acceptRate: total ? Math.round((acceptAll / total) * 100) : 0,
        },
      };
    }
  } catch {
    /* consent table may not exist yet */
  }

  return NextResponse.json({
    stats: {
      total: totalPosts || 0,
      published: published || 0,
      drafts: drafts || 0,
      todayGenerated: todayGenerated || 0,
      scheduled: 0,
      failedJobs: failedJobs || 0,
      traffic: '-',
    },
    recentPosts: recentPosts || [],
    recentLogs: recentLogs || [],
    automation: settings,
    consent,
  });
}
