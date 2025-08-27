# Database Cleanup Summary

## Overview
This document outlines the cleanup of redundant tables, fields, and data in the Supabase database to optimize performance and reduce complexity.

## Tables Removed (5 tables)

### 1. `analytics_events`
- **Reason**: Not essential for core functionality
- **Impact**: Reduces database size and complexity
- **Alternative**: Can be re-added later if analytics are needed

### 2. `og_metadata`
- **Reason**: Not essential for core functionality
- **Impact**: Reduces database size
- **Alternative**: Can be handled at the application level

### 3. `alpha_codes_summary` (view)
- **Reason**: Can be replaced with direct queries
- **Impact**: Reduces maintenance overhead
- **Alternative**: Direct SQL queries or application-level aggregation

### 4. `subscriptions`
- **Reason**: Redundant with `user_subscriptions`
- **Impact**: Eliminates duplicate functionality
- **Alternative**: Use `user_subscriptions` for all subscription data

### 5. `user_achievements`
- **Reason**: Not implemented yet
- **Impact**: Reduces unused schema complexity
- **Alternative**: Can be re-added when achievements are implemented

## Tables Removed (6 tables)

### 6. `shop_items`
- **Reason**: Incompatible schema with `shop_items_master`, which is the current active table
- **Impact**: Eliminates confusion between two shop item tables
- **Alternative**: Use `shop_items_master` for all shop functionality

## Tables Kept (15 essential tables)

### Core Authentication & Security
1. **`alpha_codes`** - Alpha code system for secure access
2. **`alpha_code_attempts`** - Security audit trail

### Game Content & Mechanics
3. **`character_dialogue_master`** - Character dialogue content
4. **`level_progression_master`** - Level progression rules
5. **`session_rewards_master`** - Session completion rewards
6. **`shop_items_master`** - Shop items available for purchase

### User Data & State
7. **`players`** - Core player data and game state
8. **`sessions`** - Focus session records and outcomes
9. **`user_inventory`** - User-owned items and equipment
10. **`user_settings`** - User preferences and settings

### E-commerce & Subscriptions
11. **`subscription_pricing_master`** - Subscription pricing and plans
12. **`user_subscriptions`** - User subscription data and status
13. **`user_purchases`** - Purchase history and transactions

### System & Infrastructure
14. **`notification_tokens`** - Push notification tokens
15. **`ops_seen`** - Idempotency tracking for API operations

## Fields Cleaned Up

### Removed from `players` table:
- `bond_score` - Not used in current phase
- `mood_state` - Not used in current phase
- `day_streak` - Not used in current phase
- `current_streak` - Not used in current phase

### Removed from `sessions` table:
- `disturbed_seconds` - Not used in current phase
- `dungeon_floor` - Not used in current phase
- `boss_tier` - Not used in current phase

## Benefits of Cleanup

### Performance Improvements
- **Reduced query complexity**: Fewer tables to join
- **Faster backups**: Less data to backup and restore
- **Better indexing**: Focus on essential tables only

### Maintenance Benefits
- **Simplified schema**: Easier to understand and maintain
- **Reduced migration complexity**: Fewer tables to manage
- **Clearer data relationships**: Less confusion about which table to use

### Development Benefits
- **Faster development**: Less cognitive overhead
- **Easier debugging**: Fewer places to look for issues
- **Better documentation**: Clearer table purposes

## Migration Process

### 1. Backup Database
```bash
# Always backup before running cleanup migrations
pg_dump your_database > backup_before_cleanup.sql
```

### 2. Run Cleanup Migration
```sql
-- Run the cleanup migration
-- File: supabase/migrations/20250127000004_cleanup_redundant_tables.sql
```

### 3. Verify Cleanup
```sql
-- Check remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 4. Update Application Code
- Remove references to deleted tables
- Update any queries that used removed fields
- Test all functionality thoroughly

## Rollback Plan

If issues arise after cleanup:

1. **Restore from backup**:
   ```bash
   psql your_database < backup_before_cleanup.sql
   ```

2. **Re-run specific migrations** if needed:
   ```sql
   -- Re-run only the migrations you need
   -- Skip the cleanup migration
   ```

## Future Considerations

### Tables That Can Be Added Back Later
- **`analytics_events`**: When analytics tracking is needed
- **`user_achievements`**: When achievement system is implemented
- **`og_metadata`**: When SEO optimization is prioritized

### Monitoring
- Monitor application performance after cleanup
- Watch for any missing functionality
- Track database size reduction

## Summary

This cleanup reduces the database from **20 tables to 14 tables** (30% reduction) while maintaining all essential functionality. The remaining tables are well-organized and serve clear, distinct purposes in the application architecture.
