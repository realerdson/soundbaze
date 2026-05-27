/**
 * Seed the Supabase database with the mock songs, artists, and annotations
 * from src/lib/data.ts.
 *
 * Run once after creating your Supabase project and applying the schema:
 *
 *   npx tsx scripts/seed.ts
 *
 * Requires:
 *   npm install -D tsx
 *
 * And a .env.local with:
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_KEY=...   (service role key — has write access, never expose in browser)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync }  from 'fs';
import { resolve }       from 'path';

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  try {
    const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    return Object.fromEntries(
      envFile.split('\n')
        .filter(l => l.trim() && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/\r/g, '')] as [string, string]; })
        .filter(([k]) => k)
    );
  } catch {
    return {};
  }
}

const env = { ...process.env, ...loadEnv() };
const SUPABASE_URL  = env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = env.SUPABASE_SERVICE_KEY;  // service role — full DB access

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Seed data ─────────────────────────────────────────────────────────────────
const ARTISTS = [
  {
    name:           'Kojo Adwoa',
    slug:           'kojo-adwoa',
    bio:            "Accra rapper and producer whose work threads Ga, Twi, and Pidgin through warm, slow-tempo hip-hop. Calls his sound 'borla & gold' — trash and treasure, same yard.",
    follower_count: 184_000,
    verified:       true,
  },
  {
    name:           'Ama Serwaa',
    slug:           'ama-serwaa',
    bio:            'Kumasi-based singer blending gospel highlife and afropop. Her debut tape Kaneshie Soundtape became a word-of-mouth classic across Accra commuter playlists.',
    follower_count: 92_000,
    verified:       false,
  },
];

const SONGS_SEED = [
  {
    title:            'Abrokyire blues',
    slug:             'abrokyire-blues',
    artist_name:      'Kojo Adwoa',
    artist_slug:      'kojo-adwoa',
    genre:            'Hiplife',
    release_year:     2024,
    annotation_count: 247,
    pageviews:        184_000,
    lyrics: `Long after the trotro park went quiet
I dey count the cracks for ceiling
Like pikin wey no fit sleep for school night
Headlights from Spintex dey paint the wall
We for call when we reach house
Nobody called
Some nights na silence be the agreement
3 a.m., the kitchen be one museum
Of waakye plates wey we forgot to wash
I keep telling myself Ɔyɛ season
But the season just dey not end`,
  },
  {
    title:            'Trotro 3 a.m.',
    slug:             'trotro-3am',
    artist_name:      'Ama Serwaa',
    artist_slug:      'ama-serwaa',
    genre:            'Gospel highlife',
    release_year:     2025,
    annotation_count: 189,
    pageviews:        112_000,
    lyrics:           '',
  },
  {
    title:            'Okay fine',
    slug:             'okay-fine',
    artist_name:      'Yaw Atoapem',
    artist_slug:      '',
    genre:            'Alté',
    release_year:     2023,
    annotation_count: 213,
    pageviews:        98_000,
    lyrics:           '',
  },
  {
    title:            'Agoo Amɛɛ',
    slug:             'agoo-amee',
    artist_name:      'Sister Adwoa',
    artist_slug:      '',
    genre:            'Gospel highlife',
    release_year:     2024,
    annotation_count: 304,
    pageviews:        221_000,
    lyrics:           '',
  },
  {
    title:            'Spintex headlights',
    slug:             'spintex-headlights',
    artist_name:      'Frafra Boys',
    artist_slug:      '',
    genre:            'Hiplife',
    release_year:     2024,
    annotation_count: 76,
    pageviews:        44_000,
    lyrics:           '',
  },
  {
    title:            'Waakye museum',
    slug:             'waakye-museum',
    artist_name:      'Akwasi Mensah',
    artist_slug:      '',
    genre:            'Hiplife',
    release_year:     2024,
    annotation_count: 121,
    pageviews:        58_000,
    lyrics:           '',
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱  Seeding SoundBaze database…\n');

  // 1. Upsert artists
  console.log('  Artists…');
  const { data: artistRows, error: artistErr } = await sb
    .from('artists')
    .upsert(ARTISTS, { onConflict: 'slug' })
    .select('id, slug');
  if (artistErr) throw artistErr;
  console.log(`  ✓ ${artistRows?.length} artists`);

  // Build slug → id map
  const artistMap = Object.fromEntries((artistRows ?? []).map(a => [a.slug, a.id]));

  // 2. Upsert songs with resolved artist_id
  console.log('  Songs…');
  const songsPayload = SONGS_SEED.map(({ artist_slug, ...s }) => ({
    ...s,
    artist_id: artist_slug ? (artistMap[artist_slug] ?? null) : null,
    lyrics:    s.lyrics || null,
  }));

  const { data: songRows, error: songErr } = await sb
    .from('songs')
    .upsert(songsPayload, { onConflict: 'slug' })
    .select('id, slug');
  if (songErr) throw songErr;
  console.log(`  ✓ ${songRows?.length} songs`);

  // 3. Seed example annotations for abrokyire-blues
  const abrokyireId = songRows?.find(s => s.slug === 'abrokyire-blues')?.id;
  if (abrokyireId) {
    console.log('  Annotations for abrokyire-blues…');

    // Compute offsets from lyrics
    const lyrics = SONGS_SEED[0].lyrics!;
    const lines  = lyrics.split('\n');
    let cursor   = 0;
    const offsets: Record<string, { start_idx: number; end_idx: number }> = {};
    for (const line of lines) {
      if (line === 'I dey count the cracks for ceiling') {
        offsets['a1'] = { start_idx: cursor, end_idx: cursor + line.length };
      }
      if (line === 'Nobody called') {
        offsets['a2'] = { start_idx: cursor, end_idx: cursor + line.length };
      }
      if (line === 'I keep telling myself Ɔyɛ season') {
        offsets['a3'] = { start_idx: cursor, end_idx: cursor + line.length };
      }
      cursor += line.length + 1;
    }

    const annotations = [
      {
        song_id:   abrokyireId,
        start_idx: offsets.a1.start_idx,
        end_idx:   offsets.a1.end_idx,
        body:      "Direct echo of Kojo's debut tape — same image, three years later, but now it's exhaustion rather than wonder. Notice 'for' standing in for 'in/on' — classic Ghanaian Pidgin compression.",
        status:    'approved',
        upvotes:   412,
      },
      {
        song_id:   abrokyireId,
        start_idx: offsets.a2.start_idx,
        end_idx:   offsets.a2.end_idx,
        body:      "The flatness of this two-word delivery is the whole song. Producer Mr Mensah drops the snare entirely on this bar — only line without percussion.",
        status:    'approved',
        upvotes:   287,
      },
      {
        song_id:   abrokyireId,
        start_idx: offsets.a3.start_idx,
        end_idx:   offsets.a3.end_idx,
        body:      "Twi: 'Ɔyɛ' = 'it is'. 'Season' here doubles as the English word and the Pidgin sense of 'a phase you push through.' He's not believing it — he's repeating a story to himself until it becomes habit.",
        status:    'approved',
        upvotes:   198,
      },
    ];

    const { error: annErr } = await sb
      .from('annotations')
      .upsert(annotations, { onConflict: 'song_id,start_idx,end_idx' });
    if (annErr) throw annErr;
    console.log(`  ✓ ${annotations.length} annotations`);
  }

  console.log('\n✅  Seed complete. Run `npm run dev` and visit /songs/abrokyire-blues.\n');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message ?? err);
  process.exit(1);
});
