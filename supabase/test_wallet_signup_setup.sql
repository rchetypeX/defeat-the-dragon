-- Test script to verify wallet signup database setup
-- Run this after applying the fix to ensure everything is working

-- 1. Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('players', 'user_settings', 'user_inventory') THEN '✅ Required'
    ELSE 'ℹ️ Optional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('players', 'user_settings', 'user_inventory', 'sessions', 'shop_items_master')
ORDER BY table_name;

-- 2. Check players table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if the trigger function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition IS NOT NULL as has_body
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';

-- 4. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement IS NOT NULL as has_action
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Check RLS policies on players table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_select_policy,
  with_check IS NOT NULL as has_insert_policy
FROM pg_policies 
WHERE tablename = 'players';

-- 6. Test the handle_new_user function by creating a test user in auth.users
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_metadata JSONB := '{"display_name": "TestUser", "wallet_address": "0x1234567890123456789012345678901234567890"}'::JSONB;
BEGIN
  RAISE NOTICE 'Testing handle_new_user function with test user ID: %', test_user_id;
  
  -- Insert a test user into auth.users to trigger the function
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    test_metadata,
    false,
    '',
    '',
    '',
    ''
  );
  
  RAISE NOTICE 'Test user inserted into auth.users';
  
  -- Check if player record was created
  IF EXISTS (SELECT 1 FROM players WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ Player record created successfully';
  ELSE
    RAISE NOTICE '❌ Player record not created';
  END IF;
  
  -- Check if user settings were created
  IF EXISTS (SELECT 1 FROM user_settings WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ User settings created successfully';
  ELSE
    RAISE NOTICE '❌ User settings not created';
  END IF;
  
  -- Check if inventory items were created
  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = test_user_id) THEN
    RAISE NOTICE '✅ Inventory items created successfully';
  ELSE
    RAISE NOTICE '❌ Inventory items not created';
  END IF;
  
  -- Clean up test data
  DELETE FROM user_inventory WHERE user_id = test_user_id;
  DELETE FROM user_settings WHERE user_id = test_user_id;
  DELETE FROM players WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'Test completed and cleaned up';
END $$;

-- 7. Check for any potential issues
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
BEGIN
  -- Check for missing columns in players table
  FOR col_name IN SELECT unnest(ARRAY['wallet_address', 'display_name', 'is_inspired', 'updated_at'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'players' 
      AND column_name = col_name
    ) THEN
      missing_columns := array_append(missing_columns, col_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '❌ Missing columns in players table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All required columns exist in players table';
  END IF;
  
  -- Check for missing indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_players_wallet_address') THEN
    RAISE NOTICE '❌ Missing index: idx_players_wallet_address';
  ELSE
    RAISE NOTICE '✅ Index exists: idx_players_wallet_address';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_players_display_name') THEN
    RAISE NOTICE '❌ Missing index: idx_players_display_name';
  ELSE
    RAISE NOTICE '✅ Index exists: idx_players_display_name';
  END IF;
END $$;
