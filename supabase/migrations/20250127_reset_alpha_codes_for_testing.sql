-- Migration to reset alpha codes for testing
-- This will wipe out all current alpha codes and create 52 new plain text codes
-- WARNING: This will delete all existing alpha codes and their usage data

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- First, let's create a temporary table to store the new plain text codes
create temporary table temp_alpha_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

-- Generate 52 new alpha codes in the format DTD-XXXX-XXXX
-- Using characters: A-Z, 2-9 (avoiding 0/O, 1/I for clarity)
insert into temp_alpha_codes (code)
select 
  'DTD-' || 
  string_agg(
    (array['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'])[floor(random() * 32 + 1)],
    ''
  ) ||
  '-' ||
  string_agg(
    (array['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'])[floor(random() * 32 + 1)],
    ''
  )
from generate_series(1, 52) as n;

-- Clear all existing alpha codes and attempts
delete from alpha_code_attempts;
delete from alpha_codes;

-- Insert the new codes into the alpha_codes table
-- For testing purposes, we'll store the plain text code in the code_hash field
-- This is NOT secure for production, but allows easy access to plain text codes
insert into alpha_codes (id, code_hash, used, created_at, notes)
select 
  id,
  code, -- Store plain text in code_hash field for easy access
  false,
  created_at,
  'Generated for testing - plain text code'
from temp_alpha_codes;

-- Create a view to easily access the plain text codes
create or replace view alpha_codes_plain_text as
select 
  id,
  code_hash as plain_text_code, -- This contains the actual code
  used,
  reserved_token,
  reserved_until,
  used_by,
  used_at,
  expires_at,
  notes,
  created_at
from alpha_codes
where notes = 'Generated for testing - plain text code';

-- Grant access to the view for admin users
grant select on alpha_codes_plain_text to service_role;

-- Output the generated codes for easy copying
select 
  'Generated Alpha Codes for Testing:' as message,
  '' as separator;

select 
  row_number() over (order by created_at) as code_number,
  code_hash as plain_text_code,
  'Available' as status
from alpha_codes 
where notes = 'Generated for testing - plain text code'
order by created_at;

-- Clean up temporary table
drop table temp_alpha_codes;

-- Add a comment to remind about the security implications
comment on view alpha_codes_plain_text is 'WARNING: This view exposes plain text alpha codes. Only use for testing. Delete this view before production deployment.';
