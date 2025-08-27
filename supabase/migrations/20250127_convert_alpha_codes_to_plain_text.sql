-- Migration to convert all alpha codes from hashed to plain text
-- This makes all codes consistent and easier to manage
-- Since the user has exclusive access to their Supabase account

-- First, let's see what we have currently
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN code_hash ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN 1 END) as plain_text_codes,
  COUNT(CASE WHEN code_hash ~ '^[a-f0-9]{64}$' THEN 1 END) as hashed_codes
FROM alpha_codes;

-- For any hashed codes, we need to regenerate them as plain text
-- Since we can't reverse the hash, we'll generate new codes to replace them

-- Delete any hashed codes (they can't be recovered)
DELETE FROM alpha_codes 
WHERE code_hash ~ '^[a-f0-9]{64}$';

-- Generate new plain text codes to replace the deleted ones
-- This will create codes in the format DTD-XXXX-XXXX
INSERT INTO alpha_codes (code_hash, is_used, created_at)
SELECT 
  'DTD-' || 
  UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(4), 'hex') FROM 1 FOR 4)) || '-' ||
  UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(4), 'hex') FROM 1 FOR 4)),
  false,
  NOW()
FROM GENERATE_SERIES(1, 52) -- Generate 52 new codes
WHERE NOT EXISTS (
  SELECT 1 FROM alpha_codes 
  WHERE code_hash ~ '^DTD-[A-Z0-9]{4}-[A-Z0-9]{4}$'
);

-- Verify the results
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN code_hash ~ '^DTD-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN 1 END) as plain_text_codes,
  COUNT(CASE WHEN code_hash ~ '^[a-f0-9]{64}$' THEN 1 END) as hashed_codes
FROM alpha_codes;
