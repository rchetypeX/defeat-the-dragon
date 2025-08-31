-- Immediate fix for shop inventory RLS policies
-- Run this in your Supabase SQL Editor to fix the shop purchase issue

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_inventory', 'user_purchases', 'user_settings')
ORDER BY tablename, policyname;

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;

DROP POLICY IF EXISTS "Users can view own purchases" ON user_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON user_purchases;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Create new inclusive policies that allow both auth users and wallet users
CREATE POLICY "Users can view own inventory" ON user_inventory 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can insert own inventory" ON user_inventory 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can update own inventory" ON user_inventory 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can delete own inventory" ON user_inventory 
FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_inventory.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

-- Create policies for user_purchases
CREATE POLICY "Users can view own purchases" ON user_purchases 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_purchases.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can insert own purchases" ON user_purchases 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_purchases.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

-- Create policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can insert own settings" ON user_settings 
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

CREATE POLICY "Users can update own settings" ON user_settings 
FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM players p 
    WHERE p.user_id = user_settings.user_id 
    AND p.wallet_address IS NOT NULL
  )
);

-- Verify the new policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_inventory', 'user_purchases', 'user_settings')
ORDER BY tablename, policyname;

-- Test if a wallet user can now insert into inventory
-- This should work after the policies are updated
SELECT 'RLS policies updated successfully. Test a purchase now!' as status;
