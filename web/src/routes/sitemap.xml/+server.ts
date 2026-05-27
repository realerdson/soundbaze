import type { RequestHandler } from './$types';
import { SONGS, ARTISTS } from '$lib/data';

const ORIGIN = 'https://soundbaze.com';

export const GET: RequestHandler = async ({ locals }) => {
  let songs:   { id: string; slug?: string }[] = [];
  let artists: { id: string; slug?: string }[] = [];

  if (locals.supabase) {
    const [s, a] = await Promise.all([
      locals.supabase.from('songs').select('id, slug'),
      locals.supabase.from('artists').select('id, slug'),
    ]);
    songs   = s.data ?? [];
    artists = a.data ?? [];
  } else {
    songs   = SONGS.map(s => ({ id: s.id }));
    artists = Object.values(ARTISTS).map(a => ({ id: a.id }));
  }

  const now = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: '/',           priority: '1.0', freq: 'daily'   },
    { loc: '/songs',      priority: '0.9', freq: 'daily'   },
    { loc: '/artists',    priority: '0.8', freq: 'weekly'  },
    { loc: '/community',  priority: '0.7', freq: 'daily'   },
    ...songs.map(s => ({
      loc:      `/songs/${s.slug ?? s.id}`,
      priority: '0.8',
      freq:     'weekly',
    })),
    ...artists.map(a => ({
      loc:      `/artists/${a.slug ?? a.id}`,
      priority: '0.7',
      freq:     'monthly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type':  'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
