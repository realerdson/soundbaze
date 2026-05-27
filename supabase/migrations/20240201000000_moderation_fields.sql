-- ── Moderation fields ────────────────────────────────────────────────────────
-- Adds flagging support and a moderator RLS policy.
-- Apply after 20240101000000_initial_schema.sql.

-- Community flagging columns
alter table annotations
  add column if not exists flagged_count integer default 0,
  add column if not exists flagged_by    uuid[]  default '{}';

-- Moderators can update any annotation (approve / reject / flag)
create policy "mod_update_annotations" on annotations
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('moderator', 'admin')
    )
  );

-- ── Tighten the insert policy — block banned users ────────────────────────────
drop policy if exists "annotations_insert" on annotations;
create policy "annotations_insert" on annotations
  for insert with check (
    auth.uid() is not null
    and not exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'banned'
    )
  );

-- IQ calculation stored procedure (idempotent — safe to re-run)
create or replace function recalculate_user_iq(target_user_id uuid)
returns void language plpgsql as $$
begin
  update profiles
  set iq_points = (
    select coalesce(sum(v.value), 0)
    from votes v
    join annotations a on a.id = v.votable_id
    where a.user_id  = target_user_id
    and   v.votable_type = 'annotation'
  )
  where id = target_user_id;
end;
$$;

-- Pageview increment RPC (safe to re-run)
create or replace function increment_pageview(song_id uuid)
returns void language plpgsql as $$
begin
  update songs set pageviews = pageviews + 1 where id = song_id;
end;
$$;
