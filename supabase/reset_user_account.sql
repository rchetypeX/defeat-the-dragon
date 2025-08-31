-- Reset User Account Script
-- This script will completely reset a specific user's account
-- WARNING: This will permanently delete ALL user data!

-- Replace 'USER_EMAIL_OR_ID' with the actual user email or UUID
-- Example: 'test@example.com' or '123e4567-e89b-12d3-a456-426614174000'

-- 1. First, get the user ID from auth.users (if you have the email)
-- Uncomment and modify the line below if you have the user's email:
-- DO $$
-- DECLARE
--   target_user_id UUID;
-- BEGIN
--   SELECT id INTO target_user_id FROM auth.users WHERE email = 'USER_EMAIL_OR_ID';
--   
--   IF target_user_id IS NULL THEN
--     RAISE EXCEPTION 'User not found with email: %', 'USER_EMAIL_OR_ID';
--   END IF;
--   
--   -- Delete user data from all tables
--   DELETE FROM user_purchases WHERE user_id = target_user_id;
--   DELETE FROM user_inventory WHERE user_id = target_user_id;
--   DELETE FROM user_achievements WHERE user_id = target_user_id;
--   DELETE FROM user_subscriptions WHERE user_id = target_user_id;
--   DELETE FROM user_settings WHERE user_id = target_user_id;
--   DELETE FROM sessions WHERE user_id = target_user_id;
--   DELETE FROM loot WHERE session_id IN (SELECT id FROM sessions WHERE user_id = target_user_id);
--   DELETE FROM classes WHERE user_id = target_user_id;
--   DELETE FROM inventory WHERE user_id = target_user_id;
--   DELETE FROM players WHERE user_id = target_user_id;
--   DELETE FROM profiles WHERE user_id = target_user_id;
--   DELETE FROM push_subscriptions WHERE user_id = target_user_id;
--   DELETE FROM subscriptions WHERE user_id = target_user_id;
--   
--   RAISE NOTICE 'User data deleted for user ID: %', target_user_id;
--   
--   -- Optionally delete the auth user (uncomment if you want to completely remove the user)
--   -- DELETE FROM auth.users WHERE id = target_user_id;
--   -- RAISE NOTICE 'Auth user deleted for user ID: %', target_user_id;
-- END $$;

-- 2. Alternative: If you know the user ID directly, use this:
-- Replace 'USER_UUID_HERE' with the actual UUID
DO $$
DECLARE
  target_user_id UUID := 'USER_UUID_HERE'::UUID;
  deleted_count INTEGER := 0;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found with ID: %', target_user_id;
  END IF;
  
  RAISE NOTICE 'Starting reset for user ID: %', target_user_id;
  
  -- Delete user data from all tables (in reverse dependency order)
  DELETE FROM user_purchases WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_purchases records', deleted_count;
  
  DELETE FROM user_inventory WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_inventory records', deleted_count;
  
  DELETE FROM user_achievements WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_achievements records', deleted_count;
  
  DELETE FROM user_subscriptions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_subscriptions records', deleted_count;
  
  DELETE FROM user_settings WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_settings records', deleted_count;
  
  DELETE FROM loot WHERE session_id IN (SELECT id FROM sessions WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % loot records', deleted_count;
  
  DELETE FROM sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % sessions records', deleted_count;
  
  DELETE FROM classes WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % classes records', deleted_count;
  
  DELETE FROM inventory WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % inventory records', deleted_count;
  
  DELETE FROM players WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % players records', deleted_count;
  
  DELETE FROM profiles WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % profiles records', deleted_count;
  
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % push_subscriptions records', deleted_count;
  
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % subscriptions records', deleted_count;
  
  RAISE NOTICE 'User account reset completed for user ID: %', target_user_id;
  
  -- Optionally delete the auth user (uncomment if you want to completely remove the user)
  -- DELETE FROM auth.users WHERE id = target_user_id;
  -- RAISE NOTICE 'Auth user deleted for user ID: %', target_user_id;
  
END $$;

-- 3. Verify the reset (optional)
-- Check what's left for the user
-- SELECT 
--   'profiles' as table_name, COUNT(*) as count FROM profiles WHERE user_id = 'USER_UUID_HERE'::UUID
-- UNION ALL
-- SELECT 'players', COUNT(*) FROM players WHERE user_id = 'USER_UUID_HERE'::UUID
-- UNION ALL
-- SELECT 'user_inventory', COUNT(*) FROM user_inventory WHERE user_id = 'USER_UUID_HERE'::UUID
-- UNION ALL
-- SELECT 'sessions', COUNT(*) FROM sessions WHERE user_id = 'USER_UUID_HERE'::UUID;
