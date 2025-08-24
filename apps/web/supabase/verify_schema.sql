-- =====================================================
-- SCHEMA VERIFICATION SCRIPT
-- =====================================================
-- Run this after applying the comprehensive schema to verify everything is working correctly

-- Check that all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check row counts for seed data
SELECT 'shop_items_master' as table_name, COUNT(*) as row_count FROM shop_items_master
UNION ALL
SELECT 'character_dialogue_master', COUNT(*) FROM character_dialogue_master
UNION ALL
SELECT 'session_rewards_master', COUNT(*) FROM session_rewards_master
ORDER BY table_name;

-- Verify shop items by category
SELECT 
    category,
    COUNT(*) as item_count,
    STRING_AGG(name, ', ' ORDER BY sort_order) as items
FROM shop_items_master 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Verify character dialogue by type
SELECT 
    dialogue_type,
    COUNT(*) as dialogue_count,
    AVG(weight) as avg_weight
FROM character_dialogue_master 
WHERE is_active = true
GROUP BY dialogue_type
ORDER BY dialogue_type;

-- Verify session rewards by type
SELECT 
    session_type,
    COUNT(*) as reward_tiers,
    MIN(duration_minutes) as min_duration,
    MAX(duration_minutes) as max_duration,
    AVG(base_xp) as avg_xp,
    AVG(base_coins) as avg_coins,
    AVG(base_sparks) as avg_sparks
FROM session_rewards_master 
WHERE is_active = true
GROUP BY session_type
ORDER BY session_type;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check RLS policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test sample queries that the app will use
-- (These should not return errors)

-- Test shop items query
SELECT item_key, name, price, currency, category 
FROM shop_items_master 
WHERE is_active = true AND category = 'character'
ORDER BY sort_order
LIMIT 5;

-- Test character dialogue query
SELECT dialogue_text, dialogue_type, weight
FROM character_dialogue_master 
WHERE is_active = true AND dialogue_type = 'motivational'
ORDER BY weight DESC
LIMIT 3;

-- Test session rewards query
SELECT session_type, duration_minutes, base_xp, base_coins, base_sparks, bonus_multiplier
FROM session_rewards_master 
WHERE is_active = true AND session_type = 'Train'
ORDER BY duration_minutes;

-- Verify foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check for any missing required columns
-- This query will help identify if any expected columns are missing
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'players', 'sessions', 
        'shop_items_master', 'character_dialogue_master', 'session_rewards_master',
        'user_inventory', 'user_purchases', 'user_settings', 'user_subscriptions',
        'analytics_events', 'notification_tokens', 'user_achievements'
    )
ORDER BY table_name, ordinal_position;

-- Final verification message
SELECT 'Schema verification complete! Check the results above for any issues.' as status;
