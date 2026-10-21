import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';
import { SITE_NAME, slugifyResource } from '@/lib/resources';
import { cleanFormConfig, isUploadCategory, isVertical, listResources } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;
  try {
    const items = await listResources();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missing = /could not find the table/i.test(message);
    return NextResponse.json(
      {
        detail: missing
          ? 'Resources table is missing. Run supabase/migrations/008_resources.sql in the Supabase SQL editor, then reload.'
          : message,
        items: [],
      },
      { status: 503 }
    );
  }
}

async function uploadFile(file: File, folder: string) {
  const db = getAdminClient();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const path = `${folder}/${Date.now()}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from('resources').upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    if (/bucket/i.test(error.message)) {
      await db.storage.createBucket('resources', { public: true });
      const retry = await db.storage.from('resources').upload(path, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
      if (retry.error) throw new Error(retry.error.message);
    } else {
      throw new Error(error.message);
    }
  }
  const { data } = db.storage.from('resources').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  try {
    const form = await request.formData();
    const title = String(form.get('title') || '').trim();
    const category = String(form.get('category') || '');
    const vertical = String(form.get('vertical') || '');
    const pdf = form.get('pdf');
    if (!title) return NextResponse.json({ detail: 'Title is required' }, { status: 400 });
    if (!isUploadCategory(category)) return NextResponse.json({ detail: 'Category is required' }, { status: 400 });
    if (!isVertical(vertical)) return NextResponse.json({ detail: 'Vertical is required' }, { status: 400 });
    if (!(pdf instanceof File) || pdf.size === 0) {
      return NextResponse.json({ detail: 'PDF file is required' }, { status: 400 });
    }

    const pdfFile = await uploadFile(pdf, 'pdf');
    const cover = form.get('cover');
    const coverFile = cover instanceof File && cover.size > 0 ? await uploadFile(cover, 'covers') : null;

    let formConfig = {};
    try {
      formConfig = JSON.parse(String(form.get('formConfig') || '{}'));
    } catch {
      formConfig = {};
    }
    let inside: unknown = [];
    try {
      inside = JSON.parse(String(form.get('insideSections') || '[]'));
    } catch {
      inside = [];
    }
    const keywords = String(form.get('keywords') || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 20);

    const slugBase = slugifyResource(String(form.get('slug') || title));
    const db = getAdminClient();
    let slug = slugBase || `resource-${Date.now()}`;
    const { data: clash } = await db.from('resources').select('id').eq('slug', slug).maybeSingle();
    if (clash) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const row = {
      title,
      description: String(form.get('description') || '').slice(0, 500),
      offered_by: String(form.get('offeredBy') || SITE_NAME).slice(0, 120) || SITE_NAME,
      author: String(form.get('author') || '').slice(0, 120),
      category,
      vertical,
      slug,
      meta_title: String(form.get('metaTitle') || '').slice(0, 160),
      meta_description: String(form.get('metaDescription') || '').slice(0, 320),
      keywords,
      overview: String(form.get('overview') || '').slice(0, 4000),
      inside_sections: Array.isArray(inside) ? inside.slice(0, 8) : [],
      pdf_url: pdfFile.url,
      pdf_path: pdfFile.path,
      cover_url: coverFile?.url || null,
      cover_path: coverFile?.path || null,
      form_config: cleanFormConfig(formConfig),
      status: 'published',
    };

    const { data, error } = await db.from('resources').insert(row).select('id, slug').single();
    if (error) return NextResponse.json({ detail: error.message }, { status: 503 });
    return NextResponse.json({ ok: true, item: data });
  } catch (err) {
    return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
