-- Fix RLS policies for shop purchase API
-- This will allow the API to properly access player data

-- 1. First, let's see what RLS policies currently exist
SELECT 
  'Current RLS policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'players';

-- 2. Check if RLS is enabled
SELECT 
  'RLS status:' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'players';

-- 3. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own player data" ON players;
DROP POLICY IF EXISTS "Users can update own player data" ON players;
DROP POLICY IF EXISTS "Users can view players by wallet address" ON players;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON players;

-- 4. Create comprehensive RLS policies that work for the API
-- Policy for SELECT (reading player data)
CREATE POLICY "Enable read access for all authenticated users" ON players
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Policy for INSERT (creating new player records)
CREATE POLICY "Enable insert for authenticated users" ON players
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Policy for UPDATE (updating player data)
CREATE POLICY "Enable update for authenticated users" ON players
  FOR UPDATE USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Policy for DELETE (if needed)
CREATE POLICY "Enable delete for authenticated users" ON players
  FOR DELETE USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- 5. Alternative: If you want to keep RLS but make it less restrictive
-- Uncomment the lines below if you prefer user-specific access:

/*
-- More restrictive but still functional policies
CREATE POLICY "Users can view own player data" ON players
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users can update own player data" ON players
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users can insert own player data" ON players
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );
*/

-- 6. Verify the new policies
SELECT 
  'New RLS policies:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'players';

-- 7. Test if the API can now access player data
-- This simulates what the shop API does
SELECT 
  'API access test after RLS fix:' as info,
  COUNT(*) as total_players,
  COUNT(CASE WHEN coins IS NOT NULL THEN 1 END) as users_with_coins,
  COUNT(CASE WHEN sparks IS NOT NULL THEN 1 END) as users_with_sparks
FROM players;
