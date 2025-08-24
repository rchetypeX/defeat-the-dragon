# 🗃️ Supabase Database Migration Guide

## Overview
This guide will help you completely reset your Supabase database and apply the comprehensive schema that supports all current app functionalities.

## ⚠️ Important Warning
**This process will DELETE ALL existing data in your Supabase project.** Make sure you have backups of any important data before proceeding.

## 📋 Pre-Migration Checklist

- [ ] **Environment Setup**: Configure your `.env.local` file (see `ENVIRONMENT_SETUP.md`)
- [ ] **Connection Test**: Run `test_connection.sql` in Supabase SQL Editor
- [ ] **Backup Data**: Backup any important data from your current database
- [ ] **Admin Access**: Ensure you have admin access to your Supabase project
- [ ] **Keys Ready**: Have your Supabase project URL and service role key ready
- [ ] **App Closed**: Close any running instances of your app

## 🚀 Step-by-Step Migration Process

### Step 0: Environment Setup (if not done)
1. Follow the `ENVIRONMENT_SETUP.md` guide to configure your environment variables
2. Run `test_connection.sql` in your Supabase SQL Editor to verify connection
3. Ensure all tests pass before proceeding

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your "Defeat the Dragon" project

### Step 2: Delete Existing Tables
1. Go to **Table Editor** in the left sidebar
2. For each existing table, click the **⋮** menu and select **Delete table**
3. Delete tables in this order to avoid foreign key conflicts:
   ```
   - user_achievements
   - user_purchases  
   - user_inventory
   - user_subscriptions
   - user_settings
   - analytics_events
   - notification_tokens
   - sessions
   - players
   - profiles
   - shop_items_master
   - character_dialogue_master
   - session_rewards_master
   - shop_items (legacy)
   - subscriptions (legacy)
   ```

### Step 3: Run the Comprehensive Schema
1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `COMPREHENSIVE_DATABASE_SCHEMA.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

### Step 4: Verify Schema Creation
1. Go back to **Table Editor**
2. Verify all these tables were created:
   ```
   ✅ profiles
   ✅ players
   ✅ sessions
   ✅ shop_items_master
   ✅ character_dialogue_master
   ✅ session_rewards_master
   ✅ user_inventory
   ✅ user_purchases
   ✅ user_settings
   ✅ user_subscriptions
   ✅ analytics_events
   ✅ notification_tokens
   ✅ user_achievements
   ✅ shop_items (legacy)
   ✅ subscriptions (legacy)
   ```

### Step 5: Verify Seed Data
1. Check **shop_items_master** table - should have 10 items (5 characters, 5 backgrounds)
2. Check **character_dialogue_master** table - should have ~20 dialogue entries
3. Check **session_rewards_master** table - should have reward configurations for all session types

### Step 6: Update Database Types (if needed)
1. In your project terminal, run:
   ```bash
   cd apps/web
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
   ```
2. Replace `YOUR_PROJECT_ID` with your actual Supabase project ID

### Step 7: Test Your Application
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Test key functionalities:
   - [ ] User registration/login
   - [ ] Player data creation
   - [ ] Focus sessions
   - [ ] Shop functionality
   - [ ] Character dialogue
   - [ ] Subscription system

## 🔧 Troubleshooting

### Common Issues and Solutions

**Issue: "relation does not exist" errors**
- **Solution**: Make sure you deleted all old tables before running the new schema

**Issue: Foreign key constraint errors**
- **Solution**: Delete tables in the order specified above, or use CASCADE when deleting

**Issue: RLS policy errors**
- **Solution**: The schema includes all necessary RLS policies. If you get access errors, check that users are properly authenticated

**Issue: Seed data not appearing**
- **Solution**: Check the SQL editor for any error messages during schema execution

**Issue: API endpoints returning errors**
- **Solution**: Verify table names match what your API routes expect

## 📊 Schema Features

Your new database includes:

### Core Tables
- **profiles**: User profile information
- **players**: Game progression data
- **sessions**: Focus session tracking

### Master Tables (Admin Controlled)
- **shop_items_master**: All shop items with prices and categories
- **character_dialogue_master**: Randomized character quotes
- **session_rewards_master**: Dynamic reward calculations

### User Data Tables
- **user_inventory**: Items owned by users
- **user_purchases**: Purchase history
- **user_settings**: User preferences
- **user_subscriptions**: Active subscriptions

### System Tables
- **analytics_events**: App usage tracking
- **notification_tokens**: Push notification support
- **user_achievements**: Achievement progress

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all user tables
- **Public read access** for master tables
- **User-specific policies** ensure data privacy
- **Admin policies** for master table management

## 🚀 Performance Optimizations

- **Comprehensive indexes** for fast queries
- **Automatic timestamps** with triggers
- **Optimized foreign key relationships**
- **Efficient query patterns**

## 📝 Post-Migration Tasks

1. **Update Environment Variables**: Ensure all required env vars are set
2. **Test All Features**: Go through each app feature systematically
3. **Monitor Performance**: Check query performance in Supabase dashboard
4. **Set Up Monitoring**: Configure alerts for important metrics

## 🆘 Need Help?

If you encounter issues during migration:

1. **Check Supabase Logs**: Go to Logs section in your Supabase dashboard
2. **Verify Environment Variables**: Ensure all required variables are set correctly
3. **Test API Endpoints**: Use the Supabase API docs to test endpoints directly
4. **Check Network Tab**: Look for failed requests in browser dev tools

## ✅ Migration Complete!

Once you've successfully completed all steps, your Supabase database will be fully configured with:

- ✅ All current app functionalities supported
- ✅ Proper security policies in place
- ✅ Performance optimizations applied
- ✅ Seed data loaded and ready
- ✅ Future-proof schema design

Your app should now work seamlessly with the new database structure!
