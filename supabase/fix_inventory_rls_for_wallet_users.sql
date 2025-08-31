-- Fix RLS policies for user_inventory to allow wallet and Base App users
-- This script addresses the issue where wallet users can't add items to inventory due to RLS policy violations

-- First, let's check the current RLS policies on the user_inventory table
-- and update them to properly handle wallet users and Base App users

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;

-- Create new policies that handle both auth users and wallet users
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

-- Also update user_purchases table policies to handle wallet users
DROP POLICY IF EXISTS "Users can view own purchases" ON user_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON user_purchases;

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

-- Update user_settings table policies as well
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

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

-- Ensure the unique constraint exists for user_inventory
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_inventory_user_id_item_id_key'
        AND table_name = 'user_inventory'
    ) THEN
        ALTER TABLE user_inventory 
        ADD CONSTRAINT user_inventory_user_id_item_id_key 
        UNIQUE (user_id, item_id);
        RAISE NOTICE '✅ Added unique constraint to user_inventory';
    ELSE
        RAISE NOTICE '✅ Unique constraint already exists on user_inventory';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_inventory TO anon, authenticated;
GRANT ALL ON public.user_purchases TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;

-- Verify the fix
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Count policies on user_inventory
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'user_inventory';
    
    RAISE NOTICE '✅ user_inventory table now has % policies', policy_count;
    
    -- Show the policies (simplified to avoid syntax issues)
    RAISE NOTICE 'Policies on user_inventory:';
    RAISE NOTICE 'Check pg_policies view manually to see policy details';
END $$;
