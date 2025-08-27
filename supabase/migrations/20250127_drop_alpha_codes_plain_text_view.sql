-- Migration to drop the alpha_codes_plain_text view
-- This view was created for temporary testing purposes and is no longer needed
-- as alpha codes are now securely hashed and managed via admin-only scripts.

DROP VIEW IF EXISTS public.alpha_codes_plain_text;
