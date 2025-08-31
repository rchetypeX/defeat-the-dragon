-- Debug script for shop purchase issue
-- This will help us understand why the API can't fetch player data

-- 1. Check if the user exists in auth.users
SELECT 
  'Auth users table:' as info,
  COUNT(*) as total_auth_users,
  MIN(created_at) as oldest_user,
  MAX(created_at) as newest_user
FROM auth.users;

-- 2. Check if the user exists in players table
SELECT 
  'Players table:' as info,
  COUNT(*) as total_players,
  COUNT(DISTINCT user_id) as unique_user_ids,
  MIN(created_at) as oldest_player,
  MAX(created_at) as newest_player
FROM players;

-- 3. Check the specific user trying to make the purchase
-- (You'll need to replace 'YOUR_USER_EMAIL' with the actual email)
SELECT 
  'Your user details:' as info,
  u.id as user_id,
  u.email,
  u.raw_user_meta_data,
  u.created_at as auth_created_at,
  CASE WHEN p.user_id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as player_record_status,
  p.display_name,
  p.coins,
  p.sparks,
  p.created_at as player_created_at
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE u.email = 'YOUR_USER_EMAIL'  -- Replace with your actual email
   OR u.email LIKE '%@%'  -- Or just show all email users
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. Check for any users without player records
SELECT 
  'Users missing player records:' as info,
  u.id as user_id,
  u.email,
  u.raw_user_meta_data,
  u.created_at
FROM auth.users u
LEFT JOIN players p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;

-- 5. Check players table structure
SELECT 
  'Players table columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- 6. Check RLS policies on players table
SELECT 
  'RLS policies on players:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'players';

-- 7. Test a simple query to see if we can access the data
SELECT 
  'Test query result:' as info,
  COUNT(*) as player_count,
  COUNT(CASE WHEN coins IS NOT NULL THEN 1 END) as users_with_coins,
  COUNT(CASE WHEN sparks IS NOT NULL THEN 1 END) as users_with_sparks
FROM players;
