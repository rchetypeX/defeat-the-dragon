-- Alpha Code System Migration
-- Required for gen_random_uuid(), digest()
create extension if not exists pgcrypto;

-- Normalize helper (server-side)
create or replace function public.normalize_alpha_code(p_code text)
returns text language sql immutable as $$
  select upper(regexp_replace(trim(p_code), '[^A-Z0-9]', '', 'g'));
$$;

-- Hash function for inserts/queries
create or replace function public.alpha_code_hash(p_code text)
returns text language sql immutable as $$
  select encode(digest(public.normalize_alpha_code(p_code), 'sha256'), 'hex');
$$;

-- Table: one row per code
create table public.alpha_codes (
  id              uuid primary key default gen_random_uuid(),
  -- security: store only a hash of the code, not the plaintext
  code_hash       text not null unique,
  used            boolean not null default false,
  reserved_token  uuid unique,           -- temp hold for pre-signup
  reserved_until  timestamptz,
  used_by         uuid,                  -- references auth.users.id (not FK to avoid cross-schema perms)
  used_at         timestamptz,
  expires_at      timestamptz,           -- optional end-of-life for a code
  notes           text,
  created_at      timestamptz not null default now()
);

-- Helpful indexes
create index on public.alpha_codes (used, reserved_until);
create index on public.alpha_codes (reserved_until) where reserved_until is not null;

-- RLS
alter table public.alpha_codes enable row level security;

-- Public/anon/auth: no direct access
create policy "deny all by default" on public.alpha_codes
  for all using (false) with check (false);

-- Admin access (service role only)
create policy "admin access" on public.alpha_codes
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- User-facing RPC (race-safe, two-step)
-- (1) Verify & Reserve before sign-up (client is anon)
create or replace function public.alpha_verify_and_reserve(p_code text)
returns table (reserved_token uuid, reserved_until timestamptz)
language plpgsql security definer as $$
declare
  v_hash text := public.alpha_code_hash(p_code);
  v_token uuid := gen_random_uuid();
  v_ttl   interval := interval '5 minutes';
begin
  -- free stale holds
  update public.alpha_codes
     set reserved_token = null, reserved_until = null
   where reserved_until is not null and reserved_until < now();

  -- lock row and check state
  update public.alpha_codes
     set reserved_token = v_token,
         reserved_until = now() + v_ttl
   where code_hash = v_hash
     and used = false
     and (expires_at is null or expires_at > now())
     and (public.alpha_codes.reserved_until is null or public.alpha_codes.reserved_until < now())
  returning reserved_token, reserved_until
    into reserved_token, reserved_until;

  if reserved_token is null then
    -- intentionally generic to avoid brute-force hints
    raise exception 'alpha code invalid';
  end if;

  return next;
end;
$$;

-- Allow anon to call this one function
grant execute on function public.alpha_verify_and_reserve(text) to anon;

-- (2) Finalize after sign-up (client is authenticated)
create or replace function public.alpha_finalize_with_token(p_token uuid)
returns boolean
language plpgsql security definer as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in';
  end if;

  update public.alpha_codes
     set used = true,
         used_by = auth.uid(),
         used_at = now(),
         reserved_token = null,
         reserved_until = null
   where reserved_token = p_token
     and reserved_until is not null
     and reserved_until > now()
     and used = false;

  if not found then
    raise exception 'alpha code invalid';
  end if;

  return true;
end;
$$;

grant execute on function public.alpha_finalize_with_token(uuid) to authenticated;

-- Admin utility function to add codes
create or replace function public.alpha_add_codes(p_codes text[])
returns integer
language plpgsql security definer as $$
declare
  v_code text;
  v_count integer := 0;
begin
  if auth.role() != 'service_role' then
    raise exception 'admin access required';
  end if;

  foreach v_code in array p_codes
  loop
    insert into public.alpha_codes (code_hash)
    values (public.alpha_code_hash(v_code))
    on conflict (code_hash) do nothing;
    
    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.alpha_add_codes(text[]) to service_role;

-- Observability: Build a Supabase dashboard view
create view public.alpha_codes_summary as
select
  used,
  count(*) as count
from public.alpha_codes
group by used;

-- Anti-abuse: Attempt logging table
create table public.alpha_code_attempts (
  id          uuid primary key default gen_random_uuid(),
  ip_address  inet,
  user_agent  text,
  code_hash   text, -- hash of attempted code
  success     boolean,
  created_at  timestamptz not null default now()
);

-- Index for cleanup
create index on public.alpha_code_attempts (created_at);

-- RLS for attempts table
alter table public.alpha_code_attempts enable row level security;

-- Allow anon to insert attempts
create policy "anon can insert attempts" on public.alpha_code_attempts
  for insert with check (true);

-- Admin can view attempts
create policy "admin can view attempts" on public.alpha_code_attempts
  for select using (auth.role() = 'service_role');

-- Cleanup function for old attempts
create or replace function public.cleanup_old_alpha_attempts()
returns integer
language plpgsql security definer as $$
declare
  v_deleted integer;
begin
  delete from public.alpha_code_attempts
  where created_at < now() - interval '7 days';
  
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.cleanup_old_alpha_attempts() to service_role;
