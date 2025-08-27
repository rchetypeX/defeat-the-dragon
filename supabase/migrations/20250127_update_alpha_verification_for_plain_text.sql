-- Migration to update alpha code verification for plain text codes
-- This changes the verification system to work with plain text codes instead of hashed codes

-- First, let's see what we have currently
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN code_hash ~ '^DTD-[A-Z0-9]{4}-[A-Z0-9]{4}$' THEN 1 END) as plain_text_codes,
  COUNT(CASE WHEN code_hash ~ '^[a-f0-9]{64}$' THEN 1 END) as hashed_codes
FROM alpha_codes;

-- Update the alpha code verification function to work with plain text codes
CREATE OR REPLACE FUNCTION verify_alpha_code(p_code text)
RETURNS TABLE(
  is_valid boolean,
  code_id uuid,
  is_used boolean,
  message text
) AS $$
DECLARE
  v_code_record RECORD;
  v_normalized_code text;
BEGIN
  -- Normalize the input code (remove spaces, convert to uppercase)
  v_normalized_code := UPPER(REGEXP_REPLACE(TRIM(p_code), '[^A-Z0-9-]', '', 'g'));
  
  -- Check if the code exists and is not used
  SELECT * INTO v_code_record
  FROM alpha_codes
  WHERE UPPER(REGEXP_REPLACE(TRIM(code_hash), '[^A-Z0-9-]', '', 'g')) = v_normalized_code
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, false, 'Invalid alpha code';
    RETURN;
  END IF;
  
  IF v_code_record.used THEN
    RETURN QUERY SELECT false, v_code_record.id, true, 'Alpha code has already been used';
    RETURN;
  END IF;
  
  -- Check if code is reserved
  IF v_code_record.reserved_token IS NOT NULL AND v_code_record.reserved_until > NOW() THEN
    RETURN QUERY SELECT false, v_code_record.id, false, 'Alpha code is currently reserved';
    RETURN;
  END IF;
  
  -- Code is valid and available
  RETURN QUERY SELECT true, v_code_record.id, false, 'Alpha code is valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the reserve alpha code function
CREATE OR REPLACE FUNCTION reserve_alpha_code(p_code text, p_reservation_token text, p_reservation_duration_minutes integer DEFAULT 5)
RETURNS TABLE(
  success boolean,
  code_id uuid,
  message text
) AS $$
DECLARE
  v_code_record RECORD;
  v_normalized_code text;
BEGIN
  -- Normalize the input code
  v_normalized_code := UPPER(REGEXP_REPLACE(TRIM(p_code), '[^A-Z0-9-]', '', 'g'));
  
  -- Check if the code exists and is available
  SELECT * INTO v_code_record
  FROM alpha_codes
  WHERE UPPER(REGEXP_REPLACE(TRIM(code_hash), '[^A-Z0-9-]', '', 'g')) = v_normalized_code
    AND NOT used
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Invalid or unavailable alpha code';
    RETURN;
  END IF;
  
  -- Check if code is already reserved
  IF v_code_record.reserved_token IS NOT NULL AND v_code_record.reserved_until > NOW() THEN
    RETURN QUERY SELECT false, v_code_record.id, 'Alpha code is already reserved';
    RETURN;
  END IF;
  
  -- Reserve the code
  UPDATE alpha_codes
  SET 
    reserved_token = p_reservation_token,
    reserved_until = NOW() + INTERVAL '1 minute' * p_reservation_duration_minutes
  WHERE id = v_code_record.id;
  
  RETURN QUERY SELECT true, v_code_record.id, 'Alpha code reserved successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the finalize alpha code function
CREATE OR REPLACE FUNCTION finalize_alpha_code(p_code text, p_user_id uuid, p_reservation_token text)
RETURNS TABLE(
  success boolean,
  message text
) AS $$
DECLARE
  v_code_record RECORD;
  v_normalized_code text;
BEGIN
  -- Normalize the input code
  v_normalized_code := UPPER(REGEXP_REPLACE(TRIM(p_code), '[^A-Z0-9-]', '', 'g'));
  
  -- Check if the code exists and is reserved with the correct token
  SELECT * INTO v_code_record
  FROM alpha_codes
  WHERE UPPER(REGEXP_REPLACE(TRIM(code_hash), '[^A-Z0-9-]', '', 'g')) = v_normalized_code
    AND reserved_token = p_reservation_token
    AND reserved_until > NOW()
    AND NOT used;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid reservation or code already used';
    RETURN;
  END IF;
  
  -- Mark the code as used
  UPDATE alpha_codes
  SET 
    used = true,
    used_by = p_user_id,
    used_at = NOW(),
    reserved_token = NULL,
    reserved_until = NULL
  WHERE id = v_code_record.id;
  
  RETURN QUERY SELECT true, 'Alpha code finalized successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_alpha_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_alpha_code(text) TO anon;
GRANT EXECUTE ON FUNCTION reserve_alpha_code(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_alpha_code(text, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION finalize_alpha_code(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_alpha_code(text, uuid, text) TO anon;

-- Verify the functions were updated
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('verify_alpha_code', 'reserve_alpha_code', 'finalize_alpha_code');
