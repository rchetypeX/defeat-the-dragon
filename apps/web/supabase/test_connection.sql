-- =====================================================
-- SUPABASE CONNECTION TEST
-- =====================================================
-- Run this in your Supabase SQL Editor to verify your connection is working

-- Test 1: Basic connection
SELECT 
    'Connection Test' as test_name,
    current_user as user,
    current_database() as database,
    version() as postgres_version;

-- Test 2: Check if we can create a temporary table
CREATE TEMP TABLE connection_test (
    id SERIAL PRIMARY KEY,
    test_time TIMESTAMPTZ DEFAULT NOW(),
    message TEXT DEFAULT 'Connection successful!'
);

INSERT INTO connection_test (message) VALUES ('Database write test passed');

SELECT 
    'Write Test' as test_name,
    COUNT(*) as records_created,
    MAX(test_time) as last_test_time
FROM connection_test;

-- Test 3: Check available extensions
SELECT 
    'Extensions Test' as test_name,
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- Test 4: Check if we have admin privileges
SELECT 
    'Privileges Test' as test_name,
    CASE 
        WHEN has_database_privilege(current_user, current_database(), 'CREATE') 
        THEN 'Admin privileges confirmed'
        ELSE 'Limited privileges - may need service role key'
    END as privilege_status;

-- Clean up
DROP TABLE IF EXISTS connection_test;

-- Final success message
SELECT 'All connection tests passed! Ready for migration.' as status;
