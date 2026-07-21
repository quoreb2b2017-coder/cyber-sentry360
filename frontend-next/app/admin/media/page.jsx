'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AdminMediaPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('/admin/articles', { params: { status: 'all', limit: 100 } }).then((r) => setPosts(r.data.items || []));
  }, []);

  const withImages = posts.filter((p) => p.hero_image);

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="border-b-2 border-foreground pb-6 mb-8">
        <div className="overline text-primary">Assets</div>
        <h1 className="font-heading font-black uppercase text-4xl md:text-5xl tracking-tighter">Media</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">{withImages.length} featured images</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {withImages.map((p) => (
          <div key={p.id} className="brutal-border bg-card overflow-hidden">
            <img src={p.hero_image} alt={p.title} className="w-full aspect-[16/10] object-cover border-b-2 border-foreground" />
            <div className="p-3">
              <div className="font-heading font-bold text-xs uppercase truncate">{p.title}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">{p.category}</div>
            </div>
          </div>
        ))}
        {withImages.length === 0 && <p className="col-span-full font-mono text-sm text-muted-foreground py-16 text-center">No media yet. Images are auto-assigned during AI generation.</p>}
      </div>
    </div>
  );
}
