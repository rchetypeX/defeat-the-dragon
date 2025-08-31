-- Test script to verify the name update flow is working correctly
-- This will test the complete flow from setting a name to persisting it in the database

-- 1. First, let's see the current state
DO $$
DECLARE
    total_users INTEGER;
    wallet_users INTEGER;
    needs_name_users INTEGER;
    real_names_count INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM players;
    
    -- Count wallet users
    SELECT COUNT(*) INTO wallet_users FROM players WHERE wallet_address IS NOT NULL;
    
    -- Count users who need to set their name
    SELECT COUNT(*) INTO needs_name_users FROM players WHERE "needsAdventurerName" = true;
    
    -- Count users with real names (not default)
    SELECT COUNT(*) INTO real_names_count FROM players 
    WHERE display_name IS NOT NULL 
    AND display_name != 'Adventurer' 
    AND NOT display_name LIKE 'Player_%'
    AND length(display_name) >= 2;
    
    RAISE NOTICE '📊 Current Database State:';
    RAISE NOTICE '   Total users: %', total_users;
    RAISE NOTICE '   Wallet users: %', wallet_users;
    RAISE NOTICE '   Need to set name: %', needs_name_users;
    RAISE NOTICE '   Users with real names: %', real_names_count;
END $$;

-- 2. Show users who need to set their name
SELECT 
    user_id,
    display_name,
    wallet_address,
    "needsAdventurerName",
    created_at
FROM players 
WHERE "needsAdventurerName" = true
ORDER BY created_at DESC;

-- 3. Show users with real names
SELECT 
    user_id,
    display_name,
    wallet_address,
    "needsAdventurerName",
    created_at
FROM players 
WHERE display_name IS NOT NULL 
AND display_name != 'Adventurer' 
AND NOT display_name LIKE 'Player_%'
AND length(display_name) >= 2
ORDER BY created_at DESC;

-- 4. Test the handle_new_user function with a test user
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_metadata JSONB := '{"display_name": "TestAdventurer", "wallet_address": "0x1234567890123456789012345678901234567890"}'::JSONB;
    test_player_id UUID;
BEGIN
    RAISE NOTICE '🧪 Testing name update flow with test user...';
    
    -- Insert a test user into auth.users to trigger the function
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        'test@example.com',
        crypt('password', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        test_metadata,
        false,
        '',
        '',
        '',
        ''
    );
    
    RAISE NOTICE '✅ Test user inserted into auth.users';
    
    -- Check if player record was created
    SELECT user_id INTO test_player_id FROM players WHERE user_id = test_user_id;
    IF test_player_id IS NOT NULL THEN
        RAISE NOTICE '✅ Player record created successfully';
        
        -- Check the values
        SELECT 
            display_name,
            wallet_address,
            coins,
            sparks,
            "needsAdventurerName"
        FROM players 
        WHERE user_id = test_user_id;
        
    ELSE
        RAISE NOTICE '❌ Player record not created';
    END IF;
    
    -- Clean up test data
    DELETE FROM user_inventory WHERE user_id = test_user_id;
    DELETE FROM user_settings WHERE user_id = test_user_id;
    DELETE FROM players WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE '🧹 Test data cleaned up';
END $$;

-- 5. Verify the database schema has all required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND table_schema = 'public'
AND column_name IN ('display_name', 'wallet_address', 'needsAdventurerName', 'coins', 'sparks')
ORDER BY column_name;

-- 6. Check if the handle_new_user function exists and is working
DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
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
    
    RAISE NOTICE '🔧 Function Status:';
    RAISE NOTICE '   handle_new_user function: %', CASE WHEN function_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '   on_auth_user_created trigger: %', CASE WHEN trigger_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    
    IF function_exists AND trigger_exists THEN
        RAISE NOTICE '🎉 Database setup is correct!';
    ELSE
        RAISE NOTICE '⚠️ Database setup has issues - run the quick fix script';
    END IF;
END $$;
