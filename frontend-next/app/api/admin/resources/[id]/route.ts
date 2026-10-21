import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireApiAuth } from '@/lib/api-auth';
import { SITE_NAME, slugifyResource } from '@/lib/resources';
import { cleanFormConfig, getResourceById, isUploadCategory, isVertical } from '@/lib/resources-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;
  const item = await getResourceById(params.id);
  if (!item) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
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
  if (error) throw new Error(error.message);
  const { data } = db.storage.from('resources').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;

  const existing = await getResourceById(params.id);
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  try {
    const form = await request.formData();
    const title = String(form.get('title') || existing.title || '').trim();
    const category = String(form.get('category') || existing.category);
    const vertical = String(form.get('vertical') || existing.vertical);
    if (!isUploadCategory(category)) return NextResponse.json({ detail: 'Category is required' }, { status: 400 });
    if (!isVertical(vertical)) return NextResponse.json({ detail: 'Vertical is required' }, { status: 400 });

    const pdf = form.get('pdf');
    const cover = form.get('cover');
    const pdfFile = pdf instanceof File && pdf.size > 0 ? await uploadFile(pdf, 'pdf') : null;
    const coverFile = cover instanceof File && cover.size > 0 ? await uploadFile(cover, 'covers') : null;

    let formConfig = existing.form_config;
    try {
      if (form.get('formConfig')) formConfig = JSON.parse(String(form.get('formConfig')));
    } catch {
      /* keep existing */
    }
    let inside = existing.inside_sections;
    try {
      if (form.get('insideSections')) inside = JSON.parse(String(form.get('insideSections')));
    } catch {
      /* keep */
    }

    const slugInput = String(form.get('slug') || existing.slug || '');
    const slug = slugifyResource(slugInput) || existing.slug;

    const keywords = String(form.get('keywords') || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 20);

    const patch = {
      title,
      description: String(form.get('description') || '').slice(0, 500),
      offered_by: String(form.get('offeredBy') || SITE_NAME).slice(0, 120),
      author: String(form.get('author') || '').slice(0, 120),
      category,
      vertical,
      slug,
      meta_title: String(form.get('metaTitle') || '').slice(0, 160),
      meta_description: String(form.get('metaDescription') || '').slice(0, 320),
      keywords,
      overview: String(form.get('overview') || '').slice(0, 4000),
      inside_sections: Array.isArray(inside) ? inside.slice(0, 8) : [],
      form_config: cleanFormConfig(formConfig),
      status: 'published',
      updated_at: new Date().toISOString(),
      ...(pdfFile ? { pdf_url: pdfFile.url, pdf_path: pdfFile.path } : {}),
      ...(coverFile ? { cover_url: coverFile.url, cover_path: coverFile.path } : {}),
    };

    const db = getAdminClient();
    const { data, error } = await db.from('resources').update(patch).eq('id', params.id).select('id, slug').single();
    if (error) return NextResponse.json({ detail: error.message }, { status: 503 });
    return NextResponse.json({ ok: true, item: data });
  } catch (err) {
    return NextResponse.json({ detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth(request);
  if (auth.response) return auth.response;
  const existing = await getResourceById(params.id);
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  const db = getAdminClient();
  const paths = [existing.pdf_path, existing.cover_path].filter((path) => typeof path === 'string' && path);
  if (paths.length) await db.storage.from('resources').remove(paths);

  const { data, error } = await db.from('resources').delete().eq('id', params.id).select('id');
  if (error) return NextResponse.json({ detail: error.message }, { status: 503 });
  if (!data?.length) return NextResponse.json({ detail: 'Delete did not remove the database row' }, { status: 500 });

  const { data: still } = await db.from('resources').select('id').eq('id', params.id).maybeSingle();
  if (still) return NextResponse.json({ detail: 'Delete did not remove the database row' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
