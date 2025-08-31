-- Quick fix for wallet signup - run this first to ensure everything is working
-- This script will fix the most common issues preventing wallet signup

-- 1. Ensure the players table exists and has all required columns
DO $$
BEGIN
    -- Create players table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players' AND table_schema = 'public') THEN
        CREATE TABLE players (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            display_name VARCHAR(50),
            wallet_address VARCHAR(42) UNIQUE,
            level INTEGER NOT NULL DEFAULT 1,
            xp INTEGER NOT NULL DEFAULT 0,
            coins INTEGER NOT NULL DEFAULT 0,
            sparks INTEGER NOT NULL DEFAULT 0,
            is_inspired BOOLEAN NOT NULL DEFAULT false,
            "needsAdventurerName" BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created players table';
    ELSE
        RAISE NOTICE 'ℹ️ Players table already exists';
    END IF;
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'needsAdventurerName') THEN
        ALTER TABLE players ADD COLUMN "needsAdventurerName" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ Added needsAdventurerName column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'wallet_address') THEN
        ALTER TABLE players ADD COLUMN wallet_address VARCHAR(42) UNIQUE;
        RAISE NOTICE '✅ Added wallet_address column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'display_name') THEN
        ALTER TABLE players ADD COLUMN display_name VARCHAR(50);
        RAISE NOTICE '✅ Added display_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'is_inspired') THEN
        ALTER TABLE players ADD COLUMN is_inspired BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE '✅ Added is_inspired column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'updated_at') THEN
        ALTER TABLE players ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
    END IF;
END $$;

-- 2. Ensure user_settings table exists
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    accessibility JSONB NOT NULL DEFAULT '{"highContrast": false, "dyslexiaFont": false, "ttsEnabled": false}',
    equipped_character VARCHAR(50) NOT NULL DEFAULT 'fighter',
    equipped_background VARCHAR(50) NOT NULL DEFAULT 'forest',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure user_inventory table exists
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('cosmetic', 'pet', 'trinket', 'character', 'background')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    equipped BOOLEAN NOT NULL DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 4. Create or recreate the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    wallet_address TEXT;
    display_name TEXT;
BEGIN
    -- Extract wallet address and display name from metadata
    wallet_address := NEW.raw_user_meta_data->>'wallet_address';
    display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Adventurer');
    
    -- Insert into players table with correct starting values
    INSERT INTO public.players (
        user_id, 
        display_name, 
        wallet_address,
        level,
        xp,
        coins,
        sparks,
        is_inspired,
        needsAdventurerName,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id, 
        display_name,
        wallet_address,
        1,  -- Default level
        0,  -- Default XP
        0,  -- Start with 0 coins
        0,  -- Start with 0 sparks
        false, -- Default inspired status
        true, -- Show name change popup for new users
        NOW(),
        NOW()
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Add default inventory items
    INSERT INTO public.user_inventory (user_id, item_id, item_type, equipped)
    VALUES 
        (NEW.id, 'fighter', 'character', true),
        (NEW.id, 'forest', 'background', true)
    ON CONFLICT (user_id, item_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- 7. Enable RLS and create policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;

CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory" ON user_inventory FOR DELETE USING (auth.uid() = user_id);

-- 8. Verify the setup
DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    tables_exist BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    -- Check if tables exist
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'players' 
        AND table_schema = 'public'
    ) AND EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings' 
        AND table_schema = 'public'
    ) AND EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_inventory' 
        AND table_schema = 'public'
    ) INTO tables_exist;
    
    RAISE NOTICE '🔧 Setup Verification:';
    RAISE NOTICE '   handle_new_user function: %', CASE WHEN function_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   on_auth_user_created trigger: %', CASE WHEN trigger_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   All required tables: %', CASE WHEN tables_exist THEN '✅ EXIST' ELSE '❌ MISSING' END;
    
    IF function_exists AND trigger_exists AND tables_exist THEN
        RAISE NOTICE '🎉 Wallet signup should now work! Try creating an account again.';
    ELSE
        RAISE NOTICE '⚠️ Some components are missing. Check the errors above.';
    END IF;
END $$;
