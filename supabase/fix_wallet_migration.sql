-- Fix wallet support migration by removing profiles table reference
-- This script should be run after the initial schema migration

-- Add wallet_address column to players table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'wallet_address') THEN
        ALTER TABLE players ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
    END IF;
END $$;

-- Add display_name column to players table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'display_name') THEN
        ALTER TABLE players ADD COLUMN display_name VARCHAR(50);
    END IF;
END $$;

-- Create index for wallet address lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_players_wallet_address ON players(wallet_address);

-- Create index for display name lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_players_display_name ON players(display_name);

-- Update the handle_new_user function to support wallet addresses (without profiles table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into players table (profiles table was removed)
  INSERT INTO public.players (user_id, display_name, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'),
    NEW.raw_user_meta_data->>'wallet_address'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for wallet address lookups (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Users can view players by wallet address') THEN
        CREATE POLICY "Users can view players by wallet address" ON players 
        FOR SELECT USING (
          auth.uid() = user_id OR 
          wallet_address IS NOT NULL
        );
    END IF;
END $$;

-- Update existing RLS policies to allow wallet-based access
DROP POLICY IF EXISTS "Users can view own player data" ON players;
CREATE POLICY "Users can view own player data" ON players 
FOR SELECT USING (
  auth.uid() = user_id OR 
  wallet_address IS NOT NULL
);

-- Add policy for wallet-based authentication
DROP POLICY IF EXISTS "Wallet users can access player data" ON players;
CREATE POLICY "Wallet users can access player data" ON players 
FOR ALL USING (
  wallet_address IS NOT NULL
);
