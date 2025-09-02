# SIWF (Sign In With Farcaster) Migration Guide

This guide explains how to implement comprehensive SIWF support in your Supabase database for the Defeat The Dragon game.

## 📋 Overview

The SIWF migration adds full support for Farcaster users, including:
- **Farcaster-specific fields** in the players table
- **Proper database indexes** for performance
- **Updated RLS policies** for security
- **Fixed field name mismatches** (experience vs xp)
- **Complete inventory system** support for SIWF users
- **Automatic user profile creation** on signup

## 🚀 Quick Start

### 1. Run the Main Migration

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f 20250127_add_siwf_support.sql
```

### 2. Verify the Migration

```bash
# Run the test script to verify everything works:
psql -h your-supabase-host -U postgres -d postgres -f test_siwf_migration.sql
```

## 📁 Migration Files

### `20250127_add_siwf_support.sql` - Main Migration
This is the comprehensive migration that adds all SIWF support.

**What it does:**
- ✅ Adds missing Farcaster fields to `players` table
- ✅ Creates proper indexes for performance
- ✅ Updates RLS policies for Farcaster users
- ✅ Fixes field name mismatches
- ✅ Ensures inventory system works for SIWF users
- ✅ Creates automatic user profile creation
- ✅ Provides function to link existing Farcaster users

### `test_siwf_migration.sql` - Verification Script
This script verifies that the migration worked correctly.

**What it tests:**
- Database structure completeness
- Index creation
- RLS policy setup
- Function availability
- Security configurations
- Performance metrics

## 🗄️ Database Changes

### New Fields Added to `players` Table

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `farcaster_fid` | INTEGER | Farcaster user ID | NULL |
| `username` | VARCHAR(100) | Farcaster username | NULL |
| `avatar_url` | TEXT | Profile picture URL | NULL |
| `email` | VARCHAR(255) | User email address | NULL |
| `experience` | INTEGER | User experience points | 0 |

### New Tables Created

#### `user_inventory`
Stores user-owned items and equipment.

#### `user_settings`
Stores user preferences and game settings.

### New Indexes Created

- `idx_players_farcaster_fid` - Fast Farcaster ID lookups
- `idx_players_username` - Fast username searches
- `idx_players_email` - Fast email lookups
- `idx_players_experience` - Fast experience-based queries
- `idx_players_farcaster_lookup` - Composite index for Farcaster queries

## 🔐 Security & RLS Policies

### Updated Policies

The migration updates RLS policies to allow:
- **Farcaster users** to access their own data
- **Wallet users** to continue working as before
- **Traditional auth users** to maintain existing access

### Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Farcaster users identified by `farcaster_fid`
- Wallet users identified by `wallet_address`

## 🎮 Game Integration

### Automatic Profile Creation

When a SIWF user signs up, the system automatically creates:
1. **Player record** with Farcaster data
2. **User settings** with default preferences
3. **Default inventory** (fighter character + forest background)

### Inventory System

SIWF users get the same inventory experience as wallet users:
- Default character: `fighter`
- Default background: `forest`
- Full access to shop and customization

## 🧪 Testing

### 1. Run Verification Script

```sql
-- This will show you exactly what's working and what isn't
\i test_siwf_migration.sql
```

### 2. Test SIWF Authentication

1. **Sign up** with a Farcaster account
2. **Verify** user profile is created automatically
3. **Check** inventory has default items
4. **Test** game features work normally

### 3. Test Existing Users

If you have existing Farcaster users, use the helper function:

```sql
-- Link an existing Farcaster user
SELECT link_existing_farcaster_user(
  12345,                    -- Farcaster FID
  'username',               -- Username
  'Display Name',           -- Display name
  'https://avatar.png',     -- Avatar URL
  'user@example.com'        -- Email
);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Migration Fails on Column Exists
**Solution**: The migration uses `IF NOT EXISTS` checks, so this shouldn't happen. If it does, check your database permissions.

#### 2. RLS Policies Not Working
**Solution**: Ensure RLS is enabled on all tables:
```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
```

#### 3. Functions Not Found
**Solution**: Check if functions were created:
```sql
SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'link_existing_farcaster_user');
```

### Debug Commands

```sql
-- Check table structure
\d players
\d user_inventory
\d user_settings

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'players';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'players';
```

## 📊 Performance Considerations

### Indexes Created

The migration creates strategic indexes for:
- **Farcaster user lookups** (fast authentication)
- **Username searches** (social features)
- **Email lookups** (account management)
- **Experience queries** (game progression)

### Query Optimization

- **Composite indexes** for multi-field queries
- **Selective indexing** to avoid unnecessary overhead
- **RLS policy optimization** for minimal performance impact

## 🔄 Rollback Plan

If you need to rollback the migration:

```sql
-- Remove Farcaster fields (WARNING: This will lose data!)
ALTER TABLE players DROP COLUMN IF EXISTS farcaster_fid;
ALTER TABLE players DROP COLUMN IF EXISTS username;
ALTER TABLE players DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE players DROP COLUMN IF EXISTS email;
ALTER TABLE players DROP COLUMN IF EXISTS experience;

-- Drop new tables
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS link_existing_farcaster_user(INTEGER, VARCHAR, VARCHAR, TEXT, VARCHAR);

-- Revert RLS policies (you'll need to recreate the original ones)
```

## 🚀 Next Steps

After running the migration:

1. **Test SIWF authentication** in your app
2. **Verify inventory creation** works for new users
3. **Update frontend code** to use the new `experience` field
4. **Test game features** with SIWF users
5. **Monitor performance** and adjust indexes if needed

## 📞 Support

If you encounter issues:

1. **Check the verification script** output for specific errors
2. **Review the troubleshooting section** above
3. **Check Supabase logs** for detailed error messages
4. **Verify database permissions** and RLS settings

## 🎯 Success Criteria

The migration is successful when:

- ✅ All Farcaster fields exist in `players` table
- ✅ RLS policies allow Farcaster user access
- ✅ Default inventory is created for new SIWF users
- ✅ Game features work normally for SIWF users
- ✅ Performance is maintained or improved
- ✅ Security is properly enforced

---

**Migration Version**: 1.0  
**Last Updated**: January 27, 2025  
**Compatibility**: Supabase PostgreSQL 12+  
**Game Version**: Defeat The Dragon v1.0+
