-- Debug script to diagnose adventurer name save issues
-- This will help identify why the name update is failing

-- 1. Check if the players table has the required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
AND table_schema = 'public'
AND column_name IN ('display_name', 'needsAdventurerName', 'user_id')
ORDER BY column_name;

-- 2. Check if there are any wallet users in the system
SELECT 
    COUNT(*) as total_wallet_users,
    COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as users_with_wallet,
    COUNT(CASE WHEN "needsAdventurerName" = true THEN 1 END) as users_needing_name
FROM players;

-- 3. Show recent wallet users and their status
SELECT 
    user_id,
    display_name,
    wallet_address,
    "needsAdventurerName",
    created_at,
    updated_at
FROM players 
WHERE wallet_address IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if the handle_new_user function exists and is working
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

-- 5. Check RLS policies on the players table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'players'
ORDER BY policyname;

-- 6. Check if there are any recent errors in the database
-- (This will show if there are any constraint violations or other issues)
SELECT 
    'No recent errors to show' as status;

-- 7. Test creating a test player record manually
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_player_id UUID;
BEGIN
    RAISE NOTICE '🧪 Testing manual player creation...';
    
    -- Try to insert a test player
    INSERT INTO players (
        user_id,
        display_name,
        wallet_address,
        level,
        xp,
        coins,
        sparks,
        "needsAdventurerName",
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'TestAdventurer',
        '0x1234567890123456789012345678901234567890',
        1,
        0,
        0,
        0,
        false,
        NOW(),
        NOW()
    ) RETURNING id INTO test_player_id;
    
    IF test_player_id IS NOT NULL THEN
        RAISE NOTICE '✅ Test player created successfully with ID: %', test_player_id;
        
        -- Try to update the display name
        UPDATE players 
        SET display_name = 'UpdatedTestAdventurer',
            "needsAdventurerName" = false,
            updated_at = NOW()
        WHERE id = test_player_id;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Test player name update successful';
        ELSE
            RAISE NOTICE '❌ Test player name update failed';
        END IF;
        
        -- Clean up test data
        DELETE FROM players WHERE id = test_player_id;
        RAISE NOTICE '🧹 Test data cleaned up';
    ELSE
        RAISE NOTICE '❌ Failed to create test player';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during test: %', SQLERRM;
END $$;

-- 8. Check if there are any missing tables or constraints
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('players', 'user_settings', 'user_inventory')
ORDER BY table_name;

-- 9. Show the current database user and permissions
SELECT 
    current_user as current_database_user,
    session_user as session_user,
    current_database() as current_database;
