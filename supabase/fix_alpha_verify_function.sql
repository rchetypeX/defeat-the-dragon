-- Fix the alpha_verify_and_reserve function to resolve ambiguous column reference
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
