'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ResourceShare } from '@/components/resources/ResourceSummary';
import { VERTICALS, sectionByCategory, verticalLabel } from '@/lib/resources';

export default function ResourceLibrary({ items = [], hideCategoryFilter = true }) {
  const [q, setQ] = useState('');
  const [vertical, setVertical] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      if (vertical && item.vertical !== vertical) return false;
      if (!query) return true;
      return `${item.title} ${item.description || ''}`.toLowerCase().includes(query);
    });
  }, [items, q, vertical]);

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-8" data-testid="resource-library">
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search this section"
          className="flex-1 border-2 border-foreground px-3 py-2 font-mono text-xs bg-background"
          aria-label="Search resources"
        />
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          className="border-2 border-foreground px-3 py-2 font-mono text-xs bg-background"
          aria-label="Filter by vertical"
        >
          <option value="">All verticals</option>
          {VERTICALS.map((v) => (
            <option key={v.slug} value={v.slug}>{v.label}</option>
          ))}
        </select>
        {!hideCategoryFilter ? null : null}
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">No matches in this section.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const section = sectionByCategory(item.category);
            const href = section?.path ? `${section.path}/${item.slug}` : `/resources/whitepapers/${item.slug}`;
            return (
              <article key={item.id} className="brutal-border bg-card flex flex-col">
                <div className="group relative border-b-2 border-foreground bg-card">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt="" className="block w-full h-auto" />
                  ) : (
                    <div className="flex h-[120px] w-full items-end p-3 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                      {verticalLabel(item.vertical)}
                    </div>
                  )}
                  <div className="absolute inset-0 hidden items-center justify-center bg-[#0B1F3D]/55 p-4 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto sm:flex">
                    <div className="grid w-full max-w-[260px] grid-cols-2 gap-2">
                      <Link href={href} className="brutal-btn w-full text-[10px] px-2 py-2 hover:bg-foreground hover:text-background">View details</Link>
                      <Link href={`${href}#download`} className="brutal-btn-primary w-full text-[10px] px-2 py-2">Download</Link>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="overline text-primary">{verticalLabel(item.vertical)}</div>
                  <h2 className="font-heading font-bold text-lg leading-snug">{item.title}</h2>
                  <ResourceShare title={item.title} href={href} />
                  <div className="grid grid-cols-2 gap-2 sm:hidden">
                    <Link href={href} className="brutal-btn w-full text-[10px] px-2 py-2">View details</Link>
                    <Link href={`${href}#download`} className="brutal-btn-primary w-full text-[10px] px-2 py-2">Download</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
