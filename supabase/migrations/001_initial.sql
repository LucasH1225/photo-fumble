-- Run once in the Supabase SQL Editor. Browser roles have no table/RPC access.
create table if not exists public.pf_sessions (
  namespace text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.pf_receipts (
  namespace text not null,
  player_id text not null,
  action_id text not null,
  receipt jsonb not null,
  created_at timestamptz not null default now(),
  primary key (namespace, player_id, action_id)
);
alter table public.pf_sessions enable row level security;
alter table public.pf_receipts enable row level security;
revoke all on public.pf_sessions, public.pf_receipts from anon, authenticated;
grant all on public.pf_sessions, public.pf_receipts to service_role;

create or replace function public.pf_commit(
  p_namespace text, p_expected bigint, p_state jsonb,
  p_action_id text, p_player_id text, p_receipt jsonb
) returns void language plpgsql security invoker set search_path = public as $$
declare current_version bigint;
begin
  -- Serializes even the first insert for a namespace.
  perform pg_advisory_xact_lock(hashtextextended(p_namespace, 0));
  if exists (select 1 from pf_receipts where namespace = p_namespace and player_id = p_player_id and action_id = p_action_id) then
    return;
  end if;
  select (state->>'version')::bigint into current_version from pf_sessions where namespace = p_namespace for update;
  if coalesce(current_version, 0) <> p_expected or (p_state->>'version')::bigint <> p_expected + 1 then
    raise exception 'VERSION_CONFLICT';
  end if;
  insert into pf_sessions(namespace, state) values (p_namespace, p_state)
    on conflict(namespace) do update set state = excluded.state, updated_at = now();
  insert into pf_receipts(namespace, player_id, action_id, receipt) values (p_namespace, p_player_id, p_action_id, p_receipt);
end $$;
revoke all on function public.pf_commit(text,bigint,jsonb,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.pf_commit(text,bigint,jsonb,text,text,jsonb) to service_role;
