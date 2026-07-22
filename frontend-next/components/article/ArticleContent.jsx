'use client';
import Link from 'next/link';
import { normalizeDashes } from '@/lib/content/meta';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function inlineFormat(text) {
  if (!text) return null;
  // links [text](url)
  const parts = [];
  let remaining = text;
  let key = 0;
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m;
  const str = text;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    if (m[1] && m[2]) {
      const href = m[2];
      const isInternal = href.startsWith('/');
      parts.push(
        isInternal ? (
          <Link key={key++} href={href} className="article-link">
            {m[1]}
          </Link>
        ) : (
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="article-link">
            {m[1]}
          </a>
        )
      );
    } else if (m[3]) {
      parts.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4]) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-muted border border-foreground/20 font-mono text-[0.85em]">
          {m[4]}
        </code>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts.length ? parts : text;
}

function parseTable(lines, startIdx) {
  const rows = [];
  let i = startIdx;
  while (i < lines.length && lines[i].includes('|')) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === ''));
    // skip separator |---|---|
    if (!cells.every((c) => /^:?-+:?$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }
  return { rows, end: i };
}

export default function ArticleContent({ content }) {
  if (!content) return null;

  const lines = normalizeDashes(content).split(/\r?\n/);
  const out = [];
  let list = null;
  let listType = 'ul';
  let skipToc = false;
  let i = 0;
  let h1Skipped = false;

  const flushList = () => {
    if (!list) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    out.push(
      <Tag key={`list-${out.length}`} className={listType === 'ol' ? 'article-ol' : 'article-ul'}>
        {list}
      </Tag>
    );
    list = null;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Skip standalone H1 (page already has title)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      if (!h1Skipped) {
        h1Skipped = true;
        i++;
        continue;
      }
    }

    // Skip "Table of Contents" section body (we render interactive TOC)
    if (/^##\s+table of contents$/i.test(trimmed)) {
      skipToc = true;
      i++;
      continue;
    }
    if (skipToc) {
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        skipToc = false;
      } else {
        i++;
        continue;
      }
    }

    if (!trimmed) {
      flushList();
      i++;
      continue;
    }

    // Tables
    if (trimmed.includes('|') && lines[i + 1]?.includes('|') && /[-|]{3,}/.test(lines[i + 1] || '')) {
      flushList();
      const { rows, end } = parseTable(lines, i);
      if (rows.length) {
        const [header, ...body] = rows;
        out.push(
          <div key={`table-${i}`} className="article-table-wrap">
            <table className="article-table">
              <thead>
                <tr>
                  {header.map((cell, ci) => (
                    <th key={ci}>{inlineFormat(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{inlineFormat(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      i = end;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      const title = trimmed.slice(3).trim();
      const id = slugify(title);
      out.push(
        <h2 key={`h2-${i}`} id={id} className="scroll-mt-20">
          {title}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      const title = trimmed.slice(4).trim();
      const id = slugify(title);
      out.push(
        <h3 key={`h3-${i}`} id={id} className="scroll-mt-20">
          {title}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      out.push(
        <blockquote key={`bq-${i}`} className="article-quote">
          {inlineFormat(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listType = 'ul';
      list = list || [];
      list.push(<li key={`li-${i}`}>{inlineFormat(trimmed.replace(/^[-*]\s+/, ''))}</li>);
      i++;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      listType = 'ol';
      list = list || [];
      list.push(<li key={`li-${i}`}>{inlineFormat(trimmed.replace(/^\d+\.\s+/, ''))}</li>);
      i++;
      continue;
    }

    flushList();
    out.push(
      <p key={`p-${i}`}>{inlineFormat(trimmed)}</p>
    );
    i++;
  }

  flushList();
  return <div className="prose-editorial max-w-none">{out}</div>;
}
