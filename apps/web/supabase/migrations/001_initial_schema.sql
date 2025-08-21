-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (length(display_name) >= 1 AND length(display_name) <= 50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    sparks INTEGER DEFAULT 0 CHECK (sparks >= 0),
    is_inspired BOOLEAN DEFAULT FALSE,
    bond_score INTEGER DEFAULT 50 CHECK (bond_score >= 0 AND bond_score <= 100),
    mood_state TEXT DEFAULT 'Warm' CHECK (mood_state IN ('Warm', 'Happy', 'Excited', 'Focused', 'Determined')),
    day_streak INTEGER DEFAULT 0 CHECK (day_streak >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('Train', 'Quest_Study', 'Learn', 'Search', 'Eat', 'Sleep', 'Bathe', 'Maintain', 'Fight', 'Adventure')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    outcome TEXT CHECK (outcome IN ('success', 'fail', 'early_stop')),
    disturbed_seconds INTEGER DEFAULT 0 CHECK (disturbed_seconds >= 0),
    dungeon_floor INTEGER DEFAULT 0 CHECK (dungeon_floor >= 0),
    boss_tier TEXT DEFAULT 'none' CHECK (boss_tier IN ('none', 'mini', 'big'))
);

-- Create inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cosmetic', 'pet', 'trinket')),
    qty INTEGER DEFAULT 1 CHECK (qty >= 1),
    equipped BOOLEAN DEFAULT FALSE
);

-- Create shop_items table
CREATE TABLE shop_items (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_coins INTEGER DEFAULT 0 CHECK (price_coins >= 0),
    price_sparks INTEGER DEFAULT 0 CHECK (price_sparks >= 0),
    type TEXT NOT NULL,
    class_lock TEXT,
    min_level INTEGER DEFAULT 1 CHECK (min_level >= 1)
);

-- Create classes table
CREATE TABLE classes (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    quest_state JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, class_id)
);

-- Create loot table
CREATE TABLE loot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('C', 'U', 'R', 'SR', 'SSR'))
);

-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    expires_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_equipped ON inventory(user_id, equipped) WHERE equipped = true;
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_loot_session_id ON loot(session_id);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Players policies
CREATE POLICY "Users can view own player data" ON players
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own player data" ON players
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own player data" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items" ON inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shop items policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view shop items" ON shop_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Classes policies
CREATE POLICY "Users can view own classes" ON classes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own classes" ON classes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classes" ON classes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loot policies
CREATE POLICY "Users can view loot from own sessions" ON loot
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = loot.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert loot for own sessions" ON loot
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = loot.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- Push subscriptions policies
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'));
    
    INSERT INTO public.players (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and player data on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
