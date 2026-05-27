-- ── Extensions ────────────────────────────────────────────────────────────
create extension if not exists pg_trgm;   -- enables trigram search
create extension if not exists pgcrypto;  -- uuid generation

-- ── Core tables ───────────────────────────────────────────────────────────
create table artists (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  bio           text,
  image_url     text,
  verified      boolean default false,
  follower_count integer default 0,
  created_at    timestamptz default now()
);

create table albums (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  artist_id   uuid references artists(id) on delete cascade,
  cover_url   text,
  release_year integer,
  created_at  timestamptz default now()
);

create table songs (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  lyrics          text,                         -- full lyrics — never sent to Algolia
  lyrics_excerpt  text generated always as      -- first 300 chars for search snippets
    (left(lyrics, 300)) stored,
  artist_id       uuid references artists(id) on delete cascade,
  artist_name     text not null,                -- denormalised for fast queries
  album_id        uuid references albums(id),
  genre           text,
  release_year    integer,
  pageviews       integer default 0,
  annotation_count integer default 0,
  cover_url       text,
  created_at      timestamptz default now(),

  -- Full-text search vector: title + artist + excerpt
  search_vector   tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '')       || ' ' ||
      coalesce(artist_name, '') || ' ' ||
      coalesce(lyrics_excerpt, ''))
  ) stored
);

create index songs_search_idx on songs using gin(search_vector);
create index songs_pageviews_idx on songs(pageviews desc);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  bio        text,
  avatar_url text,
  iq_points  integer default 0,
  role       text default 'contributor'  -- contributor | moderator | artist | admin
);

create table annotations (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid references songs(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  start_idx  integer not null check (start_idx >= 0),
  end_idx    integer not null check (end_idx > start_idx),
  body       text not null,
  status     text default 'pending',  -- pending | approved | rejected
  upvotes    integer default 0,
  created_at timestamptz default now(),

  -- Prevent exact duplicate annotations on the same range
  unique (song_id, start_idx, end_idx)
);

-- Polymorphic votes — handles votes on annotations AND comments with one table
create table votes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  votable_id   uuid not null,
  votable_type text not null check (votable_type in ('annotation', 'comment')),
  value        integer not null check (value in (1, -1)),
  created_at   timestamptz default now(),
  unique (user_id, votable_id, votable_type)  -- one vote per user per item
);

-- Polymorphic comments — on annotations or songs
create table comments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade,
  body             text not null,
  commentable_id   uuid not null,
  commentable_type text not null check (commentable_type in ('annotation', 'song')),
  created_at       timestamptz default now()
);

-- ── Row-level security ────────────────────────────────────────────────────
alter table songs       enable row level security;
alter table annotations enable row level security;
alter table votes       enable row level security;
alter table comments    enable row level security;
alter table profiles    enable row level security;

-- Songs: anyone can read, only admins/moderators can write
create policy "songs_select" on songs for select using (true);
create policy "songs_insert" on songs for insert
  with check (exists (
    select 1 from profiles where id = auth.uid()
    and role in ('admin', 'moderator')
  ));

-- Annotations: anyone reads approved ones; logged-in users create; owner edits
create policy "annotations_select" on annotations for select using (true);
create policy "annotations_insert" on annotations for insert
  with check (auth.uid() is not null);
create policy "annotations_update" on annotations for update
  using (user_id = auth.uid());

-- Votes: users manage their own votes only
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (user_id = auth.uid());
create policy "votes_delete" on votes for delete using (user_id = auth.uid());

-- Profiles: public read, owner writes
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
