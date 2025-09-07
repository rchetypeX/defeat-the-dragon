-- Test script to verify session_rewards_master table exists and is accessible
-- Run this in your Supabase SQL Editor to debug the API issue

-- Check if the table exists
SELECT 
  table_name, 
  table_schema 
FROM information_schema.tables 
WHERE table_name = 'session_rewards_master';

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'session_rewards_master' 
ORDER BY ordinal_position;

-- Check if there's data in the table
SELECT COUNT(*) as total_records FROM session_rewards_master;

-- Test a specific query that the API would make
SELECT 
  session_type, 
  duration_minutes, 
  base_xp, 
  base_coins, 
  base_sparks, 
  bonus_multiplier 
FROM session_rewards_master 
WHERE session_type = 'Train' AND duration_minutes = 5;

-- Test the query for a 5-minute session (should return Train session)
SELECT 
  session_type, 
  duration_minutes, 
  base_xp, 
  base_coins, 
  base_sparks, 
  bonus_multiplier 
FROM session_rewards_master 
WHERE session_type = 'Train' AND duration_minutes = 5;

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'session_rewards_master';
