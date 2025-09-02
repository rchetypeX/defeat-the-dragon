-- Simple SIWF Migration Test Script
-- This version avoids complex system views to prevent column name errors
-- Run this after executing the main SIWF migration to verify everything works

-- ============================================================================
-- 1. VERIFY DATABASE STRUCTURE (MOST RELIABLE)
-- ============================================================================

-- Check if all required columns exist in players table
SELECT 
  'Players Table Structure Check' as test_name,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ PASSED - All Farcaster columns exist'
    ELSE '❌ FAILED - Missing columns: ' || COUNT(*) || '/5 found'
  END as result,
  array_agg(column_name) as found_columns
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('farcaster_fid', 'username', 'avatar_url', 'email', 'experience');

-- Check if user_inventory table exists and has correct structure
SELECT 
  'User Inventory Table Check' as test_name,
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ PASSED - All inventory columns exist'
    ELSE '❌ FAILED - Missing columns: ' || COUNT(*) || '/7 found'
  END as result,
  array_agg(column_name) as found_columns
FROM information_schema.columns 
WHERE table_name = 'user_inventory' 
AND column_name IN ('id', 'user_id', 'item_id', 'item_type', 'quantity', 'equipped', 'acquired_at');

-- Check if user_settings table exists and has correct structure
SELECT 
  'User Settings Table Check' as test_name,
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ PASSED - All settings columns exist'
    ELSE '❌ FAILED - Missing columns: ' || COUNT(*) || '/7 found'
  END as result,
  array_agg(column_name) as found_columns
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name IN ('user_id', 'sound_enabled', 'notifications_enabled', 'accessibility', 'equipped_character', 'equipped_background', 'updated_at');

-- ============================================================================
-- 2. VERIFY INDEXES (SIMPLIFIED)
-- ============================================================================

-- Check if Farcaster-related indexes exist on players table
SELECT 
  'Farcaster Indexes Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSED - Farcaster indexes exist'
    ELSE '❌ FAILED - No Farcaster indexes found'
  END as result,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename = 'players' 
AND indexname LIKE '%farcaster%';

-- ============================================================================
-- 3. VERIFY RLS POLICIES (SIMPLIFIED)
-- ============================================================================

-- Check if RLS is enabled on required tables (using basic approach)
SELECT 
  'RLS Enablement Check' as test_name,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASSED - RLS enabled on all required tables'
    ELSE '❌ FAILED - RLS not enabled on: ' || COUNT(*) || '/3 tables'
  END as result
FROM (
  SELECT 1 FROM pg_tables WHERE tablename = 'players' AND rowsecurity = true
  UNION ALL
  SELECT 1 FROM pg_tables WHERE tablename = 'user_inventory' AND rowsecurity = true
  UNION ALL
  SELECT 1 FROM pg_tables WHERE tablename = 'user_settings' AND rowsecurity = true
) rls_check;

-- Check if Farcaster-related RLS policies exist
SELECT 
  'Farcaster RLS Policies Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASSED - Farcaster policies exist'
    ELSE '❌ FAILED - No Farcaster policies found'
  END as result,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'players' 
AND policyname LIKE '%Farcaster%';

-- ============================================================================
-- 4. VERIFY FUNCTIONS (MOST RELIABLE)
-- ============================================================================

-- Check if required functions exist
SELECT 
  'Required Functions Check' as test_name,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASSED - All required functions exist'
    ELSE '❌ FAILED - Missing functions: ' || COUNT(*) || '/2 found'
  END as result,
  array_agg(proname) as found_functions
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'link_existing_farcaster_user')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- 5. BASIC TABLE EXISTENCE CHECK
-- ============================================================================

-- Simple check that tables exist
SELECT 
  'Table Existence Check' as test_name,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASSED - All required tables exist'
    ELSE '❌ FAILED - Missing tables: ' || COUNT(*) || '/3 found'
  END as result
FROM information_schema.tables 
WHERE table_name IN ('players', 'user_inventory', 'user_settings')
AND table_schema = 'public';

-- ============================================================================
-- 6. SUMMARY REPORT
-- ============================================================================

-- Generate a summary report
DO $$
DECLARE
  total_checks INTEGER := 6;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SIWF MIGRATION TEST SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total checks run: %', total_checks;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Review the test results above to determine actual status';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review all test results above for ✅ PASSED or ❌ FAILED';
  RAISE NOTICE '2. If all tests show ✅ PASSED, SIWF is ready to use';
  RAISE NOTICE '3. If any tests show ❌ FAILED, review the specific error messages';
  RAISE NOTICE '4. Test the actual SIWF authentication flow';
  RAISE NOTICE '5. Verify inventory creation for new SIWF users';
  RAISE NOTICE '============================================================================';
END $$;
