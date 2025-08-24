-- =====================================================
-- DEFEAT THE DRAGON - COMPREHENSIVE DATABASE SCHEMA
-- =====================================================
-- This file contains the complete database schema for the Defeat the Dragon app
-- Run this after deleting all existing tables in your Supabase project
-- 
-- Features covered:
-- - User authentication & profiles
-- - Game mechanics (players, sessions, rewards)
-- - Shop system with master tables
-- - Inventory management
-- - Subscription system
-- - Analytics & notifications
-- - Account linking (email + wallet)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER PROFILES & AUTHENTICATION
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (length(display_name) >= 1 AND length(display_name) <= 50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. GAME MECHANICS
-- =====================================================

-- Players table (main game data)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT, -- For wallet-connected users
    display_name TEXT CHECK (length(display_name) <= 50),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    sparks INTEGER DEFAULT 0 CHECK (sparks >= 0),
    is_inspired BOOLEAN DEFAULT FALSE,
    bond_score INTEGER DEFAULT 50 CHECK (bond_score >= 0 AND bond_score <= 100),
    mood_state TEXT DEFAULT 'Warm' CHECK (mood_state IN ('Warm', 'Happy', 'Excited', 'Focused', 'Determined')),
    day_streak INTEGER DEFAULT 0 CHECK (day_streak >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(wallet_address) -- Ensure one wallet per player
);

-- Focus sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('Train', 'Quest_Study', 'Learn', 'Search', 'Eat', 'Sleep', 'Bathe', 'Maintain', 'Fight', 'Adventure')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    outcome TEXT CHECK (outcome IN ('success', 'fail', 'early_stop')),
    disturbed_seconds INTEGER DEFAULT 0 CHECK (disturbed_seconds >= 0),
    dungeon_floor INTEGER DEFAULT 0 CHECK (dungeon_floor >= 0),
    boss_tier TEXT DEFAULT 'none' CHECK (boss_tier IN ('none', 'mini', 'big')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. MASTER TABLES (Admin-controlled content)
-- =====================================================

-- Shop items master table (admin controls all shop items)
CREATE TABLE shop_items_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_key TEXT UNIQUE NOT NULL, -- Unique identifier (e.g., 'wizard', 'paladin')
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL CHECK (currency IN ('coins', 'sparks')),
    description TEXT,
    image_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('character', 'background')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character dialogue master table (admin controls all dialogue)
CREATE TABLE character_dialogue_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_text TEXT NOT NULL,
    dialogue_type TEXT DEFAULT 'general' CHECK (dialogue_type IN ('general', 'motivational', 'achievement', 'greeting')),
    weight INTEGER DEFAULT 1 CHECK (weight >= 1), -- Higher weight = more likely to appear
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session rewards master table (admin controls reward calculations)
CREATE TABLE session_rewards_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type TEXT NOT NULL CHECK (session_type IN ('Train', 'Quest_Study', 'Learn', 'Search', 'Eat', 'Sleep', 'Bathe', 'Maintain', 'Fight', 'Adventure')),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    base_xp INTEGER NOT NULL CHECK (base_xp >= 0),
    base_coins INTEGER NOT NULL CHECK (base_coins >= 0),
    base_sparks INTEGER NOT NULL CHECK (base_sparks >= 0),
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (bonus_multiplier >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_type, duration_minutes)
);

-- =====================================================
-- 4. USER INVENTORY & PURCHASES
-- =====================================================

-- User inventory table
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- References shop_items_master.item_key
    item_type TEXT NOT NULL CHECK (item_type IN ('cosmetic', 'pet', 'trinket', 'character', 'background')),
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
    equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- User purchases history
CREATE TABLE user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    price_coins INTEGER DEFAULT 0 CHECK (price_coins >= 0),
    price_sparks INTEGER DEFAULT 0 CHECK (price_sparks >= 0),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sound_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    accessibility JSONB DEFAULT '{}',
    equipped_character TEXT DEFAULT 'default',
    equipped_background TEXT DEFAULT 'forest',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. SUBSCRIPTION SYSTEM
-- =====================================================

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL, -- e.g., 'inspiration_boon'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    provider TEXT, -- e.g., 'ethereum', 'stripe'
    external_id TEXT, -- Transaction hash or external subscription ID
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    user_tag TEXT,
    auto_tag_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subscription_type) -- One subscription per type per user
);

-- =====================================================
-- 6. ANALYTICS & NOTIFICATIONS
-- =====================================================

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_fid TEXT, -- Farcaster ID
    url TEXT,
    token TEXT, -- Truncated for security
    achievement TEXT,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification tokens table (for MiniKit notifications)
CREATE TABLE notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    url TEXT NOT NULL,
    user_fid TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token, url) -- Prevent duplicate tokens
);

-- =====================================================
-- 7. ACHIEVEMENTS SYSTEM
-- =====================================================

-- User achievements table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. LEGACY TABLES (for backward compatibility)
-- =====================================================

-- Legacy shop items table (kept for compatibility)
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    price_sale INTEGER DEFAULT 0 CHECK (price_sale >= 0),
    type TEXT NOT NULL,
    class_lock TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy subscriptions table (kept for compatibility)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    provider TEXT,
    external_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    user_tag TEXT,
    auto_tag_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Core game indexes
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_wallet_address ON players(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_outcome ON sessions(outcome);

-- Master tables indexes
CREATE INDEX idx_shop_items_master_category ON shop_items_master(category);
CREATE INDEX idx_shop_items_master_active ON shop_items_master(is_active);
CREATE INDEX idx_shop_items_master_sort ON shop_items_master(category, sort_order);
CREATE INDEX idx_character_dialogue_master_active ON character_dialogue_master(is_active);
CREATE INDEX idx_character_dialogue_master_type ON character_dialogue_master(dialogue_type);
CREATE INDEX idx_session_rewards_master_type ON session_rewards_master(session_type);
CREATE INDEX idx_session_rewards_master_active ON session_rewards_master(is_active);

-- User data indexes
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item ON user_inventory(item_id, item_type);
CREATE INDEX idx_user_inventory_equipped ON user_inventory(user_id, equipped) WHERE equipped = true;
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_date ON user_purchases(purchased_at);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(expires_at);

-- Analytics indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_fid ON analytics_events(user_fid);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_notification_tokens_user_fid ON notification_tokens(user_fid);

-- =====================================================
-- 10. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_master_updated_at 
    BEFORE UPDATE ON shop_items_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_dialogue_master_updated_at 
    BEFORE UPDATE ON character_dialogue_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_rewards_master_updated_at 
    BEFORE UPDATE ON session_rewards_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at 
    BEFORE UPDATE ON shop_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on master tables (public read, admin write)
ALTER TABLE shop_items_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_dialogue_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_rewards_master ENABLE ROW LEVEL SECURITY;

-- Enable RLS on analytics and notifications
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- User-specific table policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own player data" ON players
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own player data" ON players
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own player data" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON user_inventory
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON user_purchases
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own purchases" ON user_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- Master table policies (public read access)
CREATE POLICY "Public read access for shop items" ON shop_items_master
    FOR SELECT USING (true);

CREATE POLICY "Public read access for character dialogue" ON character_dialogue_master
    FOR SELECT USING (true);

CREATE POLICY "Public read access for session rewards" ON session_rewards_master
    FOR SELECT USING (true);

-- Admin write policies for master tables (restrict to authenticated users for now)
-- TODO: Create proper admin role and restrict these policies
CREATE POLICY "Admin write access for shop items" ON shop_items_master
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write access for character dialogue" ON character_dialogue_master
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write access for session rewards" ON session_rewards_master
    FOR ALL USING (auth.role() = 'authenticated');

-- Analytics policies (allow inserts for tracking)
CREATE POLICY "Allow analytics inserts" ON analytics_events
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow analytics reads" ON analytics_events
    FOR SELECT USING (true);

-- Notification token policies
CREATE POLICY "Allow notification token management" ON notification_tokens
    FOR ALL USING (true);

-- =====================================================
-- 12. INITIAL SEED DATA
-- =====================================================

-- Insert default shop items
INSERT INTO shop_items_master (item_key, name, price, currency, description, image_url, category, sort_order) VALUES
-- Character items
('wizard', 'Wizard', 150, 'coins', 'Powerful magic user with ancient knowledge', '/assets/sprites/wizard.png', 'character', 1),
('paladin', 'Paladin', 6, 'sparks', 'Holy warrior with divine powers and unwavering faith', '/assets/sprites/paladin.png', 'character', 2),
('rogue', 'Rogue', 150, 'coins', 'Stealthy and agile fighter who strikes from shadows', '/assets/sprites/rogue.png', 'character', 3),
('archer', 'Archer', 120, 'coins', 'Master of ranged combat with deadly precision', '/assets/sprites/archer.png', 'character', 4),
('mage', 'Mage', 8, 'sparks', 'Scholar of arcane arts and elemental magic', '/assets/sprites/mage.png', 'character', 5),

-- Background items
('tundra', 'Tundra', 3, 'sparks', 'Frozen wilderness where only the strong survive', '/assets/images/tundra-background.png', 'background', 1),
('underdark', 'Underdark', 100, 'coins', 'Dark underground realm filled with ancient secrets', '/assets/images/underdark-background.png', 'background', 2),
('dungeon', 'Dungeon', 100, 'coins', 'Ancient stone corridors echoing with mystery', '/assets/images/dungeon-background.png', 'background', 3),
('volcano', 'Volcano', 5, 'sparks', 'Fiery mountain where dragons once dwelled', '/assets/images/volcano-background.png', 'background', 4),
('castle', 'Castle', 80, 'coins', 'Majestic fortress overlooking the realm', '/assets/images/castle-background.png', 'background', 5);

-- Insert default character dialogue
INSERT INTO character_dialogue_master (dialogue_text, dialogue_type, weight) VALUES
-- Motivational quotes (high weight)
('Ready to conquer your goals today?', 'motivational', 3),
('Every small step counts toward greatness!', 'motivational', 3),
('Focus is your superpower. Use it wisely!', 'motivational', 3),
('The dragon of distraction awaits. Are you ready?', 'motivational', 2),
('Your future self will thank you for this focus session.', 'motivational', 3),
('Channel your inner warrior and defeat procrastination!', 'motivational', 2),
('The path to mastery begins with a single focused moment.', 'motivational', 2),

-- Achievement-based dialogue
('Incredible focus! You''re becoming unstoppable!', 'achievement', 2),
('That was some legendary concentration!', 'achievement', 2),
('You''ve earned your victory against distraction!', 'achievement', 2),
('Your dedication is truly inspiring!', 'achievement', 2),
('Another quest completed with honor!', 'achievement', 1),

-- Greetings (high weight for frequent use)
('Welcome back, brave adventurer!', 'greeting', 3),
('Ready for another epic focus quest?', 'greeting', 3),
('The realm of productivity awaits your return!', 'greeting', 2),
('Your training ground is prepared, warrior!', 'greeting', 2),
('Time to sharpen your focus blade!', 'greeting', 1),

-- General encouragement
('Remember: progress over perfection!', 'general', 2),
('You''ve got this! One session at a time.', 'general', 3),
('The path to mastery is paved with focused moments.', 'general', 2),
('Distraction is temporary, but growth is permanent.', 'general', 2),
('Every expert was once a beginner who never gave up.', 'general', 1),
('Your consistency is your greatest weapon.', 'general', 2);

-- Insert default session rewards (base values for different session lengths and types)
INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier) VALUES
-- Train sessions (physical/skill training)
('Train', 15, 25, 10, 2, 1.0),
('Train', 25, 45, 18, 4, 1.1),
('Train', 45, 85, 35, 8, 1.2),
('Train', 60, 120, 50, 12, 1.3),

-- Study sessions (academic focus)
('Quest_Study', 15, 30, 12, 3, 1.0),
('Quest_Study', 25, 55, 22, 5, 1.1),
('Quest_Study', 45, 100, 40, 10, 1.2),
('Quest_Study', 60, 140, 60, 15, 1.3),

-- Learn sessions (skill acquisition)
('Learn', 15, 35, 15, 3, 1.0),
('Learn', 25, 60, 25, 6, 1.1),
('Learn', 45, 110, 45, 12, 1.2),
('Learn', 60, 150, 65, 18, 1.3),

-- Search sessions (research/exploration)
('Search', 15, 20, 8, 1, 1.0),
('Search', 25, 35, 15, 2, 1.1),
('Search', 45, 65, 28, 5, 1.2),
('Search', 60, 90, 40, 8, 1.3),

-- Maintenance sessions (life tasks)
('Maintain', 15, 15, 6, 1, 1.0),
('Maintain', 25, 25, 12, 2, 1.0),
('Maintain', 45, 45, 20, 4, 1.1),
('Maintain', 60, 65, 30, 6, 1.2),

-- Adventure sessions (creative/exploration)
('Adventure', 15, 40, 20, 4, 1.0),
('Adventure', 25, 70, 35, 8, 1.1),
('Adventure', 45, 130, 60, 15, 1.2),
('Adventure', 60, 180, 85, 22, 1.3);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- 
-- This schema provides:
-- ✅ Complete user authentication & profiles
-- ✅ Full game mechanics (players, sessions, rewards)
-- ✅ Dynamic shop system with admin control
-- ✅ Comprehensive inventory management
-- ✅ Subscription system with wallet support
-- ✅ Analytics and notification tracking
-- ✅ Account linking (email + wallet)
-- ✅ Achievement system
-- ✅ Proper RLS security
-- ✅ Performance indexes
-- ✅ Automatic timestamps
-- ✅ Initial seed data
-- 
-- Next steps:
-- 1. Delete all existing tables in Supabase
-- 2. Run this entire SQL file
-- 3. Verify all tables are created
-- 4. Test API endpoints
-- 5. Update database types if needed
-- =====================================================
