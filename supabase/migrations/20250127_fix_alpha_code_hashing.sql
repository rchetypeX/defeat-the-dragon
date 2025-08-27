-- Migration to fix alpha codes stored as plain text
-- This converts existing plain text codes to proper hashed format

-- Required for digest() function
create extension if not exists pgcrypto;

-- Function to normalize alpha codes (same as the one in the main migration)
create or replace function public.normalize_alpha_code(p_code text)
returns text language sql immutable as $$
  select upper(regexp_replace(trim(p_code), '[^A-Z0-9]', '', 'g'));
$$;

-- Function to hash alpha codes (same as the one in the main migration)
create or replace function public.alpha_code_hash(p_code text)
returns text language sql immutable as $$
  select encode(digest(public.normalize_alpha_code(p_code), 'sha256'), 'hex');
$$;

-- Update existing codes that are stored as plain text to proper hashed format
-- Only update codes that look like they're in plain text format (contain dashes)
update public.alpha_codes 
set code_hash = public.alpha_code_hash(code_hash)
where code_hash like 'DTD-%'
  and code_hash like '%-%'
  and length(code_hash) = 13; -- DTD-XXXX-XXXX format

-- Log how many codes were updated
select 
  'Updated ' || count(*) || ' alpha codes from plain text to hashed format' as message
from public.alpha_codes 
where code_hash like 'DTD-%'
  and code_hash like '%-%'
  and length(code_hash) = 13;

-- Verify the update worked by checking that no plain text codes remain
select 
  'Remaining plain text codes: ' || count(*) as message
from public.alpha_codes 
where code_hash like 'DTD-%'
  and code_hash like '%-%'
  and length(code_hash) = 13;

-- Show current status
select 
  'Total alpha codes: ' || count(*) as total,
  'Used codes: ' || count(*) filter (where used = true) as used,
  'Available codes: ' || count(*) filter (where used = false) as available
from public.alpha_codes;
