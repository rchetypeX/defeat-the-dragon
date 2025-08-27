-- Migration to clean up redundant tables and consolidate database structure
-- This removes unused tables and consolidates duplicate functionality

-- 1. Remove redundant tables that are not essential for core functionality

-- Remove analytics_events table (not essential for core functionality)
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Remove og_metadata table (not essential for core functionality)
DROP TABLE IF EXISTS og_metadata CASCADE;

-- Remove alpha_codes_summary view (can be replaced with direct queries)
DROP VIEW IF EXISTS alpha_codes_summary CASCADE;

-- Remove redundant subscriptions table (user_subscriptions is the main one)
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Remove user_achievements table (not implemented yet)
DROP TABLE IF EXISTS user_achievements CASCADE;

-- 2. Remove shop_items table (incompatible schema with shop_items_master)
-- The shop_items table has a different schema than shop_items_master
-- shop_items_master is the current active table, so we can safely remove shop_items
DROP TABLE IF EXISTS shop_items CASCADE;

-- 3. Clean up redundant fields in existing tables

-- Remove any unused columns from players table that might still exist
DO $$
BEGIN
    -- These columns should have been removed in previous migrations, but let's be safe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'bond_score') THEN
        ALTER TABLE players DROP COLUMN bond_score;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'mood_state') THEN
        ALTER TABLE players DROP COLUMN mood_state;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'day_streak') THEN
        ALTER TABLE players DROP COLUMN day_streak;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'current_streak') THEN
        ALTER TABLE players DROP COLUMN current_streak;
    END IF;
END $$;

-- 4. Clean up redundant indexes
DROP INDEX IF EXISTS idx_analytics_events_user_id;
DROP INDEX IF EXISTS idx_analytics_events_created_at;
DROP INDEX IF EXISTS idx_og_metadata_url;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_user_achievements_user_id;

-- 5. Clean up redundant RLS policies
DO $$
BEGIN
    -- Drop policies for removed tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
        DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'og_metadata') THEN
        DROP POLICY IF EXISTS "Anyone can view og metadata" ON og_metadata;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
        DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
        DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
        DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
    END IF;
END $$;

-- 6. Create a summary view to replace alpha_codes_summary
CREATE OR REPLACE VIEW alpha_codes_summary AS
SELECT 
    COUNT(*) as total_codes,
    COUNT(*) FILTER (WHERE used = true) as used_codes,
    COUNT(*) FILTER (WHERE used = false) as available_codes,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_codes
FROM alpha_codes;

-- 7. Add helpful comments to remaining tables
COMMENT ON TABLE alpha_codes IS 'Alpha code system for secure access control';
COMMENT ON TABLE alpha_code_attempts IS 'Audit trail for alpha code verification attempts';
COMMENT ON TABLE character_dialogue_master IS 'Character dialogue content for the game';
COMMENT ON TABLE level_progression_master IS 'Level progression rules and rewards';
COMMENT ON TABLE notification_tokens IS 'Push notification tokens for users';
COMMENT ON TABLE ops_seen IS 'Idempotency tracking for API operations';
COMMENT ON TABLE players IS 'Core player data and game state';
COMMENT ON TABLE session_rewards_master IS 'Session completion rewards configuration';
COMMENT ON TABLE sessions IS 'Focus session records and outcomes';
COMMENT ON TABLE shop_items_master IS 'Shop items available for purchase';
COMMENT ON TABLE subscription_pricing_master IS 'Subscription pricing and plans';
COMMENT ON TABLE user_inventory IS 'User-owned items and equipment';
COMMENT ON TABLE user_purchases IS 'Purchase history and transactions';
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON TABLE user_subscriptions IS 'User subscription data and status';

-- 8. Verify the cleanup
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Database cleanup completed. Remaining tables: %', table_count;
END $$;
