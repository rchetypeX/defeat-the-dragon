-- Test Script for SIWF Migration
-- Run this after executing the main SIWF migration to verify everything works
-- This script helps identify any issues and provides test data for validation

-- ============================================================================
-- 1. VERIFY DATABASE STRUCTURE
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
-- 2. VERIFY INDEXES
-- ============================================================================

-- Check if Farcaster-related indexes exist
SELECT 
  'Farcaster Indexes Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASSED - All required indexes exist'
    ELSE '❌ FAILED - Missing indexes: ' || COUNT(*) || '/5+ found'
  END as result,
  array_agg(indexname) as found_indexes
FROM pg_indexes 
WHERE tablename = 'players' 
AND indexname LIKE '%farcaster%';

-- Check if inventory and settings indexes exist
SELECT 
  'Inventory & Settings Indexes Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASSED - All required indexes exist'
    ELSE '❌ FAILED - Missing indexes: ' || COUNT(*) || '/5+ found'
  END as result,
  array_agg(indexname) as found_indexes
FROM pg_indexes 
WHERE tablename IN ('user_inventory', 'user_settings');

-- ============================================================================
-- 3. VERIFY RLS POLICIES
-- ============================================================================

-- Check if RLS is enabled on required tables
SELECT 
  'RLS Enablement Check' as test_name,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ PASSED - RLS enabled on all required tables'
    ELSE '❌ FAILED - RLS not enabled on: ' || COUNT(*) || '/3 tables'
  END as result,
  array_agg(schemaname || '.' || table_name) as tables_with_rls
FROM pg_tables 
WHERE table_name IN ('players', 'user_inventory', 'user_settings')
AND rowsecurity = true;

-- Check if Farcaster-related RLS policies exist
SELECT 
  'Farcaster RLS Policies Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASSED - All required policies exist'
    ELSE '❌ FAILED - Missing policies: ' || COUNT(*) || '/3+ found'
  END as result,
  array_agg(policyname) as found_policies
FROM pg_policies 
WHERE tablename = 'players' 
AND policyname LIKE '%Farcaster%';

-- ============================================================================
-- 4. VERIFY FUNCTIONS
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
-- 5. TEST DATA CREATION (OPTIONAL - FOR TESTING ONLY)
-- ============================================================================

-- Uncomment the section below if you want to test with sample data
/*
-- Create a test Farcaster user (for testing purposes only)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Insert test user into auth.users (simulating SIWF signup)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'test@farcaster.com',
    'test_password_hash',
    NOW(),
    NOW(),
    NOW(),
    '{"farcaster_fid": 12345, "username": "testuser", "display_name": "Test User", "avatar_url": "https://example.com/avatar.png", "email": "test@farcaster.com"}'
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE '✅ Created test user with ID: %', test_user_id;
  
  -- The handle_new_user trigger should automatically create:
  -- 1. Player record
  -- 2. User settings
  -- 3. Default inventory
  
  -- Verify the trigger worked
  IF EXISTS (SELECT 1 FROM players WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ Player record created successfully';
  ELSE
    RAISE NOTICE '❌ Player record not created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM user_settings WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ User settings created successfully';
  ELSE
    RAISE NOTICE '❌ User settings not created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ Default inventory created successfully';
  ELSE
    RAISE NOTICE '❌ Default inventory not created';
  END IF;
  
  -- Clean up test data
  DELETE FROM auth.users WHERE id = test_user_id;
  RAISE NOTICE '✅ Test data cleaned up';
  
END $$;
*/

-- ============================================================================
-- 6. PERFORMANCE CHECKS
-- ============================================================================

-- Check table sizes and row counts
SELECT 
  'Table Statistics' as test_name,
  schemaname,
  tablename,
  n_tup_ins as rows_inserted,
  n_tup_upd as rows_updated,
  n_tup_del as rows_deleted,
  n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE tablename IN ('players', 'user_inventory', 'user_settings')
ORDER BY schemaname, tablename;

-- Check index usage statistics
SELECT 
  'Index Usage Statistics' as test_name,
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('players', 'user_inventory', 'user_settings')
AND indexname LIKE '%farcaster%'
ORDER BY schemaname, tablename, indexname;

-- ============================================================================
-- 7. SECURITY CHECKS
-- ============================================================================

-- Verify that RLS policies are working correctly
-- This section helps identify any security gaps

-- Check if anonymous users can access sensitive data
SELECT 
  'Security Check - Anonymous Access' as test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSED - No anonymous access to sensitive data'
    ELSE '❌ FAILED - Anonymous users can access: ' || COUNT(*) || ' tables'
  END as result
FROM pg_policies 
WHERE tablename IN ('players', 'user_inventory', 'user_settings')
AND roles = '{anon}';

-- Check if authenticated users have proper access
SELECT 
  'Security Check - Authenticated Access' as test_name,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ PASSED - Proper authenticated access policies'
    ELSE '❌ FAILED - Missing policies: ' || COUNT(*) || '/9+ found'
  END as result,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('players', 'user_inventory', 'user_settings')
AND roles = '{authenticated}';

-- ============================================================================
-- 8. SUMMARY REPORT
-- ============================================================================

-- Generate a summary report
DO $$
DECLARE
  total_checks INTEGER := 0;
  passed_checks INTEGER := 0;
  failed_checks INTEGER := 0;
BEGIN
  -- Count total checks (this is a simplified count)
  total_checks := 8;
  
  -- Note: Manual review of results above is required
  -- The summary below is a template - review the actual test results above
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SIWF MIGRATION TEST SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total checks run: %', total_checks;
  RAISE NOTICE 'Passed: % (Review results above)', passed_checks;
  RAISE NOTICE 'Failed: % (Review results above)', failed_checks;
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
