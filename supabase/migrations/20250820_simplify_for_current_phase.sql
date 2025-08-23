-- Migration to simplify schema for current phase
-- Remove tables that are not yet implemented

-- Drop tables that are not needed for current phase
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS loot CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- First, update existing sessions to use valid actions before changing constraints
UPDATE sessions SET action = 'Train' WHERE action NOT IN ('Train', 'Quest_Study', 'Learn', 'Search');

-- Simplify players table to only include current phase fields
-- Check if columns exist before dropping to avoid errors
DO $$ 
BEGIN
    -- Drop columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_inspired') THEN
        ALTER TABLE players DROP COLUMN is_inspired;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'bond_score') THEN
        ALTER TABLE players DROP COLUMN bond_score;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'mood_state') THEN
        ALTER TABLE players DROP COLUMN mood_state;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'day_streak') THEN
        ALTER TABLE players DROP COLUMN day_streak;
    END IF;
    
    -- Handle coins and sparks columns carefully
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'coins') THEN
        -- Column exists, just ensure it has the right default
        ALTER TABLE players ALTER COLUMN coins SET DEFAULT 100;
    ELSE
        ALTER TABLE players ADD COLUMN coins INTEGER NOT NULL DEFAULT 100 CHECK (coins >= 0);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'sparks') THEN
        -- Column exists, just ensure it has the right default
        ALTER TABLE players ALTER COLUMN sparks SET DEFAULT 50;
    ELSE
        ALTER TABLE players ADD COLUMN sparks INTEGER NOT NULL DEFAULT 50 CHECK (sparks >= 0);
    END IF;
END $$;

-- Simplify sessions table to focus on core focus session mechanics
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'disturbed_seconds') THEN
        ALTER TABLE sessions DROP COLUMN disturbed_seconds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'dungeon_floor') THEN
        ALTER TABLE sessions DROP COLUMN dungeon_floor;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'boss_tier') THEN
        ALTER TABLE sessions DROP COLUMN boss_tier;
    END IF;
END $$;

-- Simplify action types to only include current phase actions
-- Drop existing constraint first
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_action_check;
-- Add new constraint
ALTER TABLE sessions ADD CONSTRAINT sessions_action_check 
  CHECK (action IN ('Train', 'Quest_Study', 'Learn', 'Search'));

-- Simplify outcome types
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_outcome_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_outcome_check 
  CHECK (outcome IN ('success', 'fail', 'early_stop'));

-- Drop indexes for removed tables (only if they exist)
DROP INDEX IF EXISTS idx_inventory_user_id;
DROP INDEX IF EXISTS idx_inventory_sku;
DROP INDEX IF EXISTS idx_classes_user_id;
DROP INDEX IF EXISTS idx_loot_session_id;
DROP INDEX IF EXISTS idx_push_subscriptions_user_id;

-- Update the handle_new_user function to only create basic data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'));
  
  INSERT INTO public.players (user_id, display_name, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'),
    NEW.raw_user_meta_data->>'wallet_address'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop RLS policies for removed tables (only if tables exist)
DO $$ 
BEGIN
    -- Only drop policies if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory') THEN
        DROP POLICY IF EXISTS "Users can view own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;
        DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_items') THEN
        DROP POLICY IF EXISTS "Anyone can view shop items" ON shop_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
        DROP POLICY IF EXISTS "Users can view own classes" ON classes;
        DROP POLICY IF EXISTS "Users can insert own classes" ON classes;
        DROP POLICY IF EXISTS "Users can update own classes" ON classes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loot') THEN
        DROP POLICY IF EXISTS "Users can view own loot" ON loot;
        DROP POLICY IF EXISTS "Users can insert own loot" ON loot;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
        DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
    END IF;
END $$;
