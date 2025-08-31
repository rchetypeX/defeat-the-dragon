-- Debug script to diagnose wallet signup issues
-- Run this in your Supabase SQL editor to see what's wrong

-- 1. Check if the handle_new_user function exists and is working
DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    function_definition TEXT;
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
    
    -- Get function definition
    SELECT pg_get_functiondef(oid) INTO function_definition
    FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE '📊 Function Status:';
    RAISE NOTICE '   handle_new_user function exists: %', function_exists;
    RAISE NOTICE '   on_auth_user_created trigger exists: %', trigger_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Function exists';
        RAISE NOTICE 'Function definition: %', function_definition;
    ELSE
        RAISE NOTICE '❌ Function missing - this is the problem!';
    END IF;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Trigger exists';
    ELSE
        RAISE NOTICE '❌ Trigger missing - this is also a problem!';
    END IF;
END $$;

-- 2. Check if all required tables and columns exist
DO $$
DECLARE
    players_table_exists BOOLEAN;
    user_settings_table_exists BOOLEAN;
    user_inventory_table_exists BOOLEAN;
    needs_adventurer_name_exists BOOLEAN;
    wallet_address_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'players' 
        AND table_schema = 'public'
    ) INTO players_table_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_settings' 
        AND table_schema = 'public'
    ) INTO user_settings_table_exists;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_inventory' 
        AND table_schema = 'public'
    ) INTO user_inventory_table_exists;
    
    -- Check if required columns exist in players table
    IF players_table_exists THEN
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name = 'needsAdventurerName'
        ) INTO needs_adventurer_name_exists;
        
        SELECT EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name = 'wallet_address'
        ) INTO wallet_address_exists;
    END IF;
    
    RAISE NOTICE '📊 Table Status:';
    RAISE NOTICE '   players table exists: %', players_table_exists;
    RAISE NOTICE '   user_settings table exists: %', user_settings_table_exists;
    RAISE NOTICE '   user_inventory table exists: %', user_inventory_table_exists;
    
    IF players_table_exists THEN
        RAISE NOTICE '   needsAdventurerName column exists: %', needs_adventurer_name_exists;
        RAISE NOTICE '   wallet_address column exists: %', wallet_address_exists;
    END IF;
    
    IF NOT players_table_exists THEN
        RAISE NOTICE '❌ players table missing - this will cause signup to fail!';
    END IF;
    
    IF NOT needs_adventurer_name_exists THEN
        RAISE NOTICE '❌ needsAdventurerName column missing - this will cause function to fail!';
    END IF;
    
    IF NOT wallet_address_exists THEN
        RAISE NOTICE '❌ wallet_address column missing - this will cause function to fail!';
    END IF;
END $$;

-- 3. Check current players table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any recent auth.users entries
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if there are any recent players entries
SELECT 
    user_id,
    display_name,
    wallet_address,
    coins,
    sparks,
    "needsAdventurerName",
    created_at
FROM players 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test the handle_new_user function manually (if it exists)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_metadata JSONB := '{"display_name": "TestUser", "wallet_address": "0x1234567890123456789012345678901234567890"}'::JSONB;
    function_exists BOOLEAN;
BEGIN
    -- Check if function exists before testing
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '🧪 Testing handle_new_user function...';
        
        -- Test the function directly
        BEGIN
            PERFORM public.handle_new_user();
            RAISE NOTICE '❌ Function call failed - this indicates a problem!';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Function error: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Cannot test function - it does not exist!';
    END IF;
END $$;
