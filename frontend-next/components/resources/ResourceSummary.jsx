'use client';

import { useState } from 'react';
import { Check, Link2, Linkedin } from 'lucide-react';

export function ResourceSummary({ description, overview, inside = [] }) {
  const [open, setOpen] = useState(false);
  const extra = Boolean(overview) || inside.some((block) => block.heading || block.body);
  const longDescription = String(description || '').length > 140;
  const canExpand = longDescription || extra;

  return (
    <div className="space-y-3">
      {description ? (
        <p className={`text-lg text-foreground/80 ${open ? '' : 'line-clamp-3'}`}>{description}</p>
      ) : null}
      {open ? (
        <>
          {overview ? <div className="prose-editorial text-base leading-relaxed whitespace-pre-wrap">{overview}</div> : null}
          {inside.map((block) => (
            <section key={block.heading || block.body}>
              {block.heading ? <h2 className="mb-2 font-heading text-lg font-bold uppercase">{block.heading}</h2> : null}
              {block.body ? <p className="leading-relaxed text-foreground/85">{block.body}</p> : null}
            </section>
          ))}
        </>
      ) : null}
      {canExpand ? (
        <button type="button" className="font-mono text-[11px] uppercase tracking-widest text-primary underline underline-offset-2" onClick={() => setOpen((value) => !value)}>
          {open ? 'Show less' : 'Read full'}
        </button>
      ) : null}
    </div>
  );
}

export function ResourceShare({ title, href }) {
  const [copied, setCopied] = useState(false);

  const pageUrl = () => {
    if (typeof window === 'undefined') return href || '';
    if (!href) return window.location.href;
    return new URL(href, window.location.origin).href;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(pageUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer,width=640,height=720');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={shareLinkedIn} className="share-btn share-btn-linkedin" aria-label="Share on LinkedIn">
        <Linkedin className="h-3.5 w-3.5" />
        LinkedIn
      </button>
      <button type="button" onClick={copy} className="share-btn share-btn-copy" aria-label="Copy link">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <span className="sr-only">{title}</span>
    </div>
  );
}
