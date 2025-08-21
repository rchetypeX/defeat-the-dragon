-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  sparks INTEGER NOT NULL DEFAULT 0 CHECK (sparks >= 0),
  is_inspired BOOLEAN NOT NULL DEFAULT false,
  bond_score INTEGER NOT NULL DEFAULT 0 CHECK (bond_score >= 0 AND bond_score <= 100),
  mood_state TEXT NOT NULL DEFAULT 'Warm' CHECK (mood_state IN ('Warm', 'Happy', 'Excited', 'Focused', 'Determined')),
  day_streak INTEGER NOT NULL DEFAULT 0 CHECK (day_streak >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('Train', 'Quest_Study', 'Learn', 'Search', 'Eat', 'Sleep', 'Bathe', 'Maintain', 'Fight', 'Adventure')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT CHECK (outcome IN ('success', 'fail', 'early_stop')),
  disturbed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (disturbed_seconds >= 0),
  dungeon_floor INTEGER NOT NULL DEFAULT 0 CHECK (dungeon_floor >= 0),
  boss_tier TEXT NOT NULL DEFAULT 'none' CHECK (boss_tier IN ('none', 'mini', 'big'))
);

-- Create inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cosmetic', 'pet', 'trinket')),
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 1),
  equipped BOOLEAN NOT NULL DEFAULT false
);

-- Create shop_items table
CREATE TABLE shop_items (
  sku VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_coins INTEGER NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  price_sparks INTEGER NOT NULL DEFAULT 0 CHECK (price_sparks >= 0),
  type VARCHAR(50) NOT NULL,
  class_lock VARCHAR(50),
  min_level INTEGER NOT NULL DEFAULT 1 CHECK (min_level >= 1)
);

-- Create classes table
CREATE TABLE classes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id VARCHAR(50) NOT NULL,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  quest_state JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, class_id)
);

-- Create loot table
CREATE TABLE loot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('C', 'U', 'R', 'SR', 'SSR'))
);

-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_loot_session_id ON loot(session_id);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for players
CREATE POLICY "Users can view own player data" ON players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own player data" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player data" ON players FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for inventory
CREATE POLICY "Users can view own inventory" ON inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON inventory FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for shop_items (public read)
CREATE POLICY "Anyone can view shop items" ON shop_items FOR SELECT USING (true);

-- Create RLS policies for classes
CREATE POLICY "Users can view own classes" ON classes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own classes" ON classes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own classes" ON classes FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for loot
CREATE POLICY "Users can view own loot" ON loot FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions s 
    WHERE s.id = loot.session_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own loot" ON loot FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s 
    WHERE s.id = loot.session_id AND s.user_id = auth.uid()
  )
);

-- Create RLS policies for push_subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create profile and player data on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer'));
  
  INSERT INTO public.players (user_id)
  VALUES (NEW.id);
  
  -- Insert default classes
  INSERT INTO public.classes (user_id, class_id, unlocked)
  VALUES 
    (NEW.id, 'Fighter', true),
    (NEW.id, 'Rogue', false),
    (NEW.id, 'Wizard', false),
    (NEW.id, 'Cleric', false),
    (NEW.id, 'Ranger', false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and player data on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
