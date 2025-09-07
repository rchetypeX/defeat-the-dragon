-- Debug user authentication and sync issues
-- This will help identify why the API is failing with 500 errors

-- Check if the user exists in the auth.users table
SELECT 'Checking auth.users table:' as status;
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  phone_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if the user exists in the players table
SELECT 'Checking players table:' as status;
SELECT 
  id,
  wallet_address,
  display_name,
  level,
  xp,
  coins,
  sparks,
  created_at,
  updated_at
FROM players 
ORDER BY created_at DESC 
LIMIT 5;

-- Check RLS policies on players table
SELECT 'Checking RLS policies on players table:' as status;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'players';

-- Check RLS policies on sessions table
SELECT 'Checking RLS policies on sessions table:' as status;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'sessions';

-- Check if there are any active sessions
SELECT 'Checking active sessions:' as status;
SELECT 
  id,
  user_id,
  action,
  duration_minutes,
  started_at,
  ended_at,
  is_active
FROM sessions 
WHERE ended_at IS NULL 
ORDER BY started_at DESC 
LIMIT 5;

-- Test a simple query that the API would make
SELECT 'Testing API query simulation:' as status;
-- This simulates what the API tries to do
SELECT 
  p.id,
  p.wallet_address,
  p.display_name,
  p.level,
  p.xp,
  p.coins,
  p.sparks
FROM players p
WHERE p.wallet_address = '0xf283f4fff884c70df8f731321ba76ec665f22ee7'
LIMIT 1;
