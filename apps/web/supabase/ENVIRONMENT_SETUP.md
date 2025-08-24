# 🔧 Supabase Environment Setup Guide

## Overview
This guide ensures your environment variables are properly configured for the database migration and app functionality.

## 📋 Required Environment Variables

### 1. Supabase Configuration (Required)
```bash
# Your Supabase project URL (from API Settings)
NEXT_PUBLIC_SUPABASE_URL=https://zbqrrtjmavergvuddncs.supabase.co

# Client API Key (anon key) - for client-side operations
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key - for server-side operations (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. MiniKit Configuration (Required for Base App)
```bash
# Your OnchainKit API key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Defeat the Dragon
```

### 3. App Configuration
```bash
# Your app's public URL
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_ICON=https://your-app.vercel.app/logo.svg
```

### 4. Subscription System (Optional)
```bash
# Your Base Network wallet address for receiving payments
NEXT_PUBLIC_MERCHANT_WALLET=0xYourWalletAddressHere
```

## 🔑 How to Get Your Supabase Keys

### Step 1: Access Your Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in and navigate to your "Defeat the Dragon" project
3. Go to **Settings** → **API** in the left sidebar

### Step 2: Copy Your Keys
From the API settings page, you'll find:

**Project URL:**
```
https://zbqrrtjmavergvuddncs.supabase.co
```

**Client API Key (anon key):**
- This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used for client-side operations
- Safe to expose in browser

**Service Role Key:**
- This is your `SUPABASE_SERVICE_ROLE_KEY`
- Used for server-side operations
- **NEVER expose this in client-side code**
- Has full database access

## 📝 Environment File Setup

### 1. Create/Update `.env.local`
```bash
# Copy from .env.example and fill in your actual values
cp .env.example .env.local
```

### 2. Update `.env.local` with your actual values:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zbqrrtjmavergvuddncs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MiniKit Configuration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_actual_onchainkit_key
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=Defeat the Dragon

# App Configuration
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_ICON=https://your-app.vercel.app/logo.svg

# Optional: Subscription System
NEXT_PUBLIC_MERCHANT_WALLET=0xYourWalletAddressHere
```

## ✅ Connection Verification

### Test Your Connection
Run this in your Supabase SQL Editor to verify your keys work:

```sql
-- Test connection and permissions
SELECT 
    current_user,
    current_database(),
    version()
LIMIT 1;
```

### Expected Result:
```
current_user | current_database | version
-------------|------------------|----------
postgres     | postgres         | PostgreSQL 15.1...
```

## 🔐 Security Best Practices

### ✅ Do's:
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- Use `SUPABASE_SERVICE_ROLE_KEY` only in API routes (server-side)
- Keep `.env.local` in your `.gitignore`
- Use environment variables in production deployments

### ❌ Don'ts:
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Don't commit `.env.local` to version control
- Don't use the service role key for client-side authentication

## 🚀 Migration Preparation Checklist

Before running the database migration:

- [ ] **Environment variables set** in `.env.local`
- [ ] **Supabase project URL** confirmed correct
- [ ] **Client API key** working (test connection)
- [ ] **Service role key** working (test admin operations)
- [ ] **App restarted** after environment changes
- [ ] **No running instances** of the app during migration

## 🔧 Troubleshooting

### Issue: "Invalid API key" errors
**Solution:** 
1. Verify your keys are copied correctly from Supabase dashboard
2. Check for extra spaces or characters
3. Ensure you're using the right key for the right operation

### Issue: "Project not found" errors
**Solution:**
1. Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check that your project is active in Supabase dashboard
3. Ensure you have access to the project

### Issue: "Permission denied" errors
**Solution:**
1. Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
2. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client operations
3. Check RLS policies are set up correctly

## 📞 Need Help?

If you encounter issues:

1. **Check Supabase Dashboard** → Settings → API for correct keys
2. **Verify Environment Variables** are loaded correctly
3. **Test Connection** using the SQL verification query above
4. **Check Supabase Logs** for detailed error messages

## ✅ Ready for Migration!

Once your environment is properly configured:

1. **Run the comprehensive schema** (`COMPREHENSIVE_DATABASE_SCHEMA.sql`)
2. **Update session rewards** (`update_session_rewards.sql`)
3. **Verify the migration** (`verify_schema.sql`)
4. **Test your application** functionality

Your Supabase connection should now be ready for the migration!
