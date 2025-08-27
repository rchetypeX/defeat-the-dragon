-- Migration to wipe out all account data for fresh testing
-- This will remove all user data while preserving the database structure
-- WARNING: This will permanently delete all user accounts, sessions, and data

-- First, let's see what we're about to delete
SELECT 
  'Current Data Counts:' as info,
  (SELECT COUNT(*) FROM players) as total_players,
  (SELECT COUNT(*) FROM sessions) as total_sessions,
  (SELECT COUNT(*) FROM user_inventory) as total_inventory_items,
  (SELECT COUNT(*) FROM user_settings) as total_user_settings,
  (SELECT COUNT(*) FROM alpha_code_attempts) as total_alpha_attempts,
  (SELECT COUNT(*) FROM ops_seen) as total_ops_seen;

-- Disable triggers temporarily to avoid conflicts
ALTER TABLE players DISABLE TRIGGER ALL;
ALTER TABLE sessions DISABLE TRIGGER ALL;
ALTER TABLE user_inventory DISABLE TRIGGER ALL;
ALTER TABLE user_settings DISABLE TRIGGER ALL;

-- Clear all user-related data (in dependency order)
-- 1. Clear session data
DELETE FROM sessions WHERE user_id IS NOT NULL;

-- 2. Clear inventory data
DELETE FROM user_inventory WHERE user_id IS NOT NULL;

-- 3. Clear user settings
DELETE FROM user_settings WHERE user_id IS NOT NULL;

-- 4. Clear ops seen data
DELETE FROM ops_seen WHERE user_id IS NOT NULL;

-- 5. Clear alpha code attempts (if table still exists)
-- Note: This table might have been removed in previous migrations
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alpha_code_attempts') THEN
    DELETE FROM alpha_code_attempts WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- 6. Clear all player data
DELETE FROM players WHERE user_id IS NOT NULL;

-- Re-enable triggers
ALTER TABLE players ENABLE TRIGGER ALL;
ALTER TABLE sessions ENABLE TRIGGER ALL;
ALTER TABLE user_inventory ENABLE TRIGGER ALL;
ALTER TABLE user_settings ENABLE TRIGGER ALL;

-- Verify the cleanup
SELECT 
  'After Cleanup Data Counts:' as info,
  (SELECT COUNT(*) FROM players) as remaining_players,
  (SELECT COUNT(*) FROM sessions) as remaining_sessions,
  (SELECT COUNT(*) FROM user_inventory) as remaining_inventory_items,
  (SELECT COUNT(*) FROM user_settings) as remaining_user_settings,
  (SELECT COUNT(*) FROM ops_seen) as remaining_ops_seen;

-- Show remaining alpha codes (these should be preserved for admin use)
SELECT 
  'Alpha Codes Status:' as info,
  (SELECT COUNT(*) FROM alpha_codes) as total_alpha_codes,
  (SELECT COUNT(*) FROM alpha_codes WHERE used = false) as available_alpha_codes,
  (SELECT COUNT(*) FROM alpha_codes WHERE used = true) as used_alpha_codes;

-- Reset any sequences if they exist
DO $$
BEGIN
  -- Reset player ID sequence if it exists
  IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'players_id_seq') THEN
    ALTER SEQUENCE players_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset session ID sequence if it exists
  IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'sessions_id_seq') THEN
    ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset inventory ID sequence if it exists
  IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'user_inventory_id_seq') THEN
    ALTER SEQUENCE user_inventory_id_seq RESTART WITH 1;
  END IF;
END $$;

-- Final confirmation
SELECT '✅ All user data has been wiped successfully!' as status;
SELECT '📋 You can now start fresh with new player accounts.' as next_steps;
SELECT '🔑 Alpha codes are preserved for admin testing.' as alpha_codes_status;
