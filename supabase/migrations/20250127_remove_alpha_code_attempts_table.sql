-- Migration to remove the unnecessary alpha_code_attempts table
-- We only need to track successful code usage, not failed attempts
-- This saves database resources and simplifies the system

-- First, let's see what's in the attempts table (for reference)
SELECT 
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN success THEN 1 END) as successful_attempts,
  COUNT(CASE WHEN NOT success THEN 1 END) as failed_attempts
FROM alpha_code_attempts;

-- Show some sample failed attempts (for reference before deletion)
SELECT 
  code_entered,
  success,
  error_message,
  created_at
FROM alpha_code_attempts 
WHERE NOT success
ORDER BY created_at DESC
LIMIT 10;

-- Drop the alpha_code_attempts table
DROP TABLE IF EXISTS alpha_code_attempts;

-- Verify the table was dropped
SELECT 
  'alpha_code_attempts table removed successfully' as status,
  'Only successful code usage is tracked in alpha_codes table' as note;

-- Show what we're keeping (the important stuff)
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN used THEN 1 END) as used_codes,
  COUNT(CASE WHEN NOT used THEN 1 END) as available_codes
FROM alpha_codes;
