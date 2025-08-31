-- Migration to completely remove Alpha Code feature and all related remnants
-- This will clean up all alpha code related tables, views, functions, and data

-- 1. Drop alpha code related tables completely
DROP TABLE IF EXISTS alpha_codes CASCADE;
DROP TABLE IF EXISTS alpha_code_attempts CASCADE;

-- 2. Drop alpha code related views
DROP VIEW IF EXISTS alpha_codes_summary CASCADE;

-- 3. Drop any alpha code related functions (if they exist)
DO $$
BEGIN
    -- Drop function if it exists
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'verify_alpha_code') THEN
        DROP FUNCTION IF EXISTS verify_alpha_code CASCADE;
    END IF;
    
    -- Drop function if it exists
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'redeem_alpha_code') THEN
        DROP FUNCTION IF EXISTS redeem_alpha_code CASCADE;
    END IF;
    
    -- Drop function if it exists
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_alpha_codes') THEN
        DROP FUNCTION IF EXISTS generate_alpha_codes CASCADE;
    END IF;
END $$;

-- 4. Drop any alpha code related triggers (if they exist)
DO $$
BEGIN
    -- Drop trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_alpha_code_verification') THEN
        DROP TRIGGER IF EXISTS trigger_alpha_code_verification ON alpha_codes;
    END IF;
    
    -- Drop trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_alpha_code_attempts') THEN
        DROP TRIGGER IF EXISTS trigger_alpha_code_attempts ON alpha_code_attempts;
    END IF;
END $$;

-- 5. Drop any alpha code related indexes (if they exist)
DROP INDEX IF EXISTS idx_alpha_codes_code;
DROP INDEX IF EXISTS idx_alpha_codes_used;
DROP INDEX IF EXISTS idx_alpha_codes_expires_at;
DROP INDEX IF EXISTS idx_alpha_code_attempts_user_id;
DROP INDEX IF EXISTS idx_alpha_code_attempts_code;
DROP INDEX IF EXISTS idx_alpha_code_attempts_created_at;

-- 6. Drop any alpha code related RLS policies (if they exist)
DO $$
BEGIN
    -- Drop policies for alpha_codes table if it still exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alpha_codes') THEN
        DROP POLICY IF EXISTS "Alpha codes are viewable by admins" ON alpha_codes;
        DROP POLICY IF EXISTS "Alpha codes can be updated by admins" ON alpha_codes;
        DROP POLICY IF EXISTS "Alpha codes can be inserted by admins" ON alpha_codes;
        DROP POLICY IF EXISTS "Alpha codes can be deleted by admins" ON alpha_codes;
    END IF;
    
    -- Drop policies for alpha_code_attempts table if it still exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alpha_code_attempts') THEN
        DROP POLICY IF EXISTS "Alpha code attempts are viewable by admins" ON alpha_code_attempts;
        DROP POLICY IF EXISTS "Alpha code attempts can be inserted by users" ON alpha_code_attempts;
        DROP POLICY IF EXISTS "Alpha code attempts can be updated by admins" ON alpha_code_attempts;
    END IF;
END $$;

-- 7. Remove any alpha code related comments
DO $$
BEGIN
    -- Remove comments from alpha_codes table if it still exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alpha_codes') THEN
        COMMENT ON TABLE alpha_codes IS NULL;
    END IF;
    
    -- Remove comments from alpha_code_attempts table if it still exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alpha_code_attempts') THEN
        COMMENT ON TABLE alpha_code_attempts IS NULL;
    END IF;
END $$;

-- 8. Clean up any remaining alpha code related data in other tables
-- (This is a safety measure in case there are any foreign key references)

-- 9. Verify the cleanup
DO $$
DECLARE
    alpha_codes_exists BOOLEAN;
    alpha_code_attempts_exists BOOLEAN;
    alpha_codes_summary_exists BOOLEAN;
BEGIN
    -- Check if alpha code tables still exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'alpha_codes' AND table_schema = 'public'
    ) INTO alpha_codes_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'alpha_code_attempts' AND table_schema = 'public'
    ) INTO alpha_code_attempts_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'alpha_codes_summary' AND table_schema = 'public'
    ) INTO alpha_codes_summary_exists;
    
    -- Report the cleanup status
    IF NOT alpha_codes_exists AND NOT alpha_code_attempts_exists AND NOT alpha_codes_summary_exists THEN
        RAISE NOTICE '✅ Alpha Code feature completely removed!';
        RAISE NOTICE '   - alpha_codes table: REMOVED';
        RAISE NOTICE '   - alpha_code_attempts table: REMOVED';
        RAISE NOTICE '   - alpha_codes_summary view: REMOVED';
    ELSE
        RAISE NOTICE '⚠️  Some alpha code remnants may still exist:';
        IF alpha_codes_exists THEN
            RAISE NOTICE '   - alpha_codes table: STILL EXISTS';
        END IF;
        IF alpha_code_attempts_exists THEN
            RAISE NOTICE '   - alpha_code_attempts table: STILL EXISTS';
        END IF;
        IF alpha_codes_summary_exists THEN
            RAISE NOTICE '   - alpha_codes_summary view: STILL EXISTS';
        END IF;
    END IF;
END $$;

-- 10. Final confirmation
SELECT '🎯 Alpha Code Feature Removal Complete!' as status;
SELECT '📋 All alpha code related structures have been removed.' as details;
SELECT '🚀 Your database is now clean of alpha code remnants.' as next_steps;
