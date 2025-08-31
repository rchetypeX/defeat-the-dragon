-- Simple test to check players table access
-- Run this in Supabase SQL Editor

-- 1. Basic table access test
SELECT 'Basic access test:' as info, COUNT(*) as player_count FROM players;

-- 2. Check if we can see specific columns
SELECT 
  'Column access test:' as info,
  COUNT(coins) as users_with_coins,
  COUNT(sparks) as users_with_sparks,
  COUNT(user_id) as users_with_user_id
FROM players;

-- 3. Check the most recent user
SELECT 
  'Most recent user:' as info,
  user_id,
  display_name,
  coins,
  sparks,
  created_at
FROM players 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Check if RLS is enabled
SELECT 
  'RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'players';

-- 5. Test a simple query that matches the API
-- (This simulates what the shop API is trying to do)
SELECT 
  'API simulation test:' as info,
  user_id,
  coins,
  sparks
FROM players 
WHERE user_id IS NOT NULL
LIMIT 3;
