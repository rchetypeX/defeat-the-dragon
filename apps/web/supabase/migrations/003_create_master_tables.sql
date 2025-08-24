-- Create master tables for centralized content management
-- These tables allow admin to update content across all app instances

-- 1. Shop Items Master Table
CREATE TABLE shop_items_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_key TEXT UNIQUE NOT NULL, -- Unique identifier for the item (e.g., 'wizard', 'paladin')
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

-- 2. Character Dialogue Master Table
CREATE TABLE character_dialogue_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_text TEXT NOT NULL,
    dialogue_type TEXT DEFAULT 'general' CHECK (dialogue_type IN ('general', 'motivational', 'achievement', 'greeting')),
    weight INTEGER DEFAULT 1 CHECK (weight >= 1), -- Higher weight = more likely to appear
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Session Rewards Master Table
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

-- Create indexes for better performance
CREATE INDEX idx_shop_items_master_category ON shop_items_master(category);
CREATE INDEX idx_shop_items_master_active ON shop_items_master(is_active);
CREATE INDEX idx_character_dialogue_master_active ON character_dialogue_master(is_active);
CREATE INDEX idx_character_dialogue_master_type ON character_dialogue_master(dialogue_type);
CREATE INDEX idx_session_rewards_master_type ON session_rewards_master(session_type);
CREATE INDEX idx_session_rewards_master_active ON session_rewards_master(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_shop_items_master_updated_at 
    BEFORE UPDATE ON shop_items_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_dialogue_master_updated_at 
    BEFORE UPDATE ON character_dialogue_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_rewards_master_updated_at 
    BEFORE UPDATE ON session_rewards_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default shop items
INSERT INTO shop_items_master (item_key, name, price, currency, description, image_url, category, sort_order) VALUES
-- Character items
('wizard', 'Wizard', 150, 'coins', 'Powerful magic user', '/assets/sprites/wizard.png', 'character', 1),
('paladin', 'Paladin', 6, 'sparks', 'Holy warrior with divine powers', '/assets/sprites/paladin.png', 'character', 2),
('rogue', 'Rogue', 150, 'coins', 'Stealthy and agile fighter', '/assets/sprites/rogue.png', 'character', 3),

-- Background items
('tundra', 'Tundra', 3, 'sparks', 'Frozen wilderness', '/assets/images/tundra-background.png', 'background', 1),
('underdark', 'Underdark', 100, 'coins', 'Dark underground realm', '/assets/images/underdark-background.png', 'background', 2),
('dungeon', 'Dungeon', 100, 'coins', 'Ancient stone corridors', '/assets/images/dungeon-background.png', 'background', 3);

-- Insert default character dialogue
INSERT INTO character_dialogue_master (dialogue_text, dialogue_type, weight) VALUES
-- General motivational quotes
('Ready to conquer your goals today?', 'motivational', 3),
('Every small step counts toward greatness!', 'motivational', 3),
('Focus is your superpower. Use it wisely!', 'motivational', 3),
('The dragon of distraction awaits. Are you ready?', 'motivational', 2),
('Your future self will thank you for this focus session.', 'motivational', 3),

-- Achievement-based dialogue
('Incredible focus! You''re becoming unstoppable!', 'achievement', 2),
('That was some legendary concentration!', 'achievement', 2),
('You''ve earned your victory against distraction!', 'achievement', 2),

-- General greetings
('Welcome back, brave adventurer!', 'greeting', 3),
('Ready for another epic focus quest?', 'greeting', 3),
('The realm of productivity awaits your return!', 'greeting', 2),

-- General encouragement
('Remember: progress over perfection!', 'general', 2),
('You''ve got this! One session at a time.', 'general', 3),
('The path to mastery is paved with focused moments.', 'general', 2),
('Distraction is temporary, but growth is permanent.', 'general', 2);

-- Insert default session rewards (base values for different session lengths)
INSERT INTO session_rewards_master (session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier) VALUES
-- Train sessions
('Train', 15, 25, 10, 2, 1.0),
('Train', 25, 45, 18, 4, 1.1),
('Train', 45, 85, 35, 8, 1.2),
('Train', 60, 120, 50, 12, 1.3),

-- Study sessions
('Quest_Study', 15, 30, 12, 3, 1.0),
('Quest_Study', 25, 55, 22, 5, 1.1),
('Quest_Study', 45, 100, 40, 10, 1.2),
('Quest_Study', 60, 140, 60, 15, 1.3),

-- Learn sessions
('Learn', 15, 35, 15, 3, 1.0),
('Learn', 25, 60, 25, 6, 1.1),
('Learn', 45, 110, 45, 12, 1.2),
('Learn', 60, 150, 65, 18, 1.3),

-- Other session types with base rewards
('Search', 15, 20, 8, 1, 1.0),
('Search', 25, 35, 15, 2, 1.1),
('Search', 45, 65, 28, 5, 1.2),
('Search', 60, 90, 40, 8, 1.3);

-- Enable Row Level Security (RLS)
ALTER TABLE shop_items_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_dialogue_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_rewards_master ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (all users can read)
CREATE POLICY "Public read access for shop items" ON shop_items_master
    FOR SELECT USING (true);

CREATE POLICY "Public read access for character dialogue" ON character_dialogue_master
    FOR SELECT USING (true);

CREATE POLICY "Public read access for session rewards" ON session_rewards_master
    FOR SELECT USING (true);

-- Admin-only policies for write access (you'll need to set up admin role)
-- For now, we'll create policies that allow authenticated users to modify
-- You should restrict this to admin users only in production

CREATE POLICY "Admin write access for shop items" ON shop_items_master
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write access for character dialogue" ON character_dialogue_master
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin write access for session rewards" ON session_rewards_master
    FOR ALL USING (auth.role() = 'authenticated');
