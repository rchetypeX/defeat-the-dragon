# 🗄️ Supabase Players Table Issues & Fixes

## 🚨 **Issues Identified**

### 1. **Redundant `experience` Column**
- **Problem**: The `experience` column was added during Farcaster integration but is redundant with the existing `xp` column
- **Impact**: Data duplication and confusion about which field to use for experience points
- **Solution**: Remove the `experience` column entirely

### 2. **NULL Values in Farcaster Fields**
- **Problem**: Columns `email`, `avatar_url`, `username`, `farcaster_fid` return NULL values
- **Root Cause**: 
  - Metadata extraction in `handle_new_user` function doesn't match actual data structure
  - Email field not properly synced from `auth.users.email`
  - Farcaster metadata not being passed during Base App signup

### 3. **Email Sync Mismatch**
- **Problem**: `players.email` doesn't reflect `auth.users.email` values
- **Root Cause**: The trigger function was trying to extract email from metadata instead of using the actual email field

### 4. **Multiple Conflicting Functions**
- **Problem**: Multiple migration files have different versions of `handle_new_user` function
- **Impact**: Inconsistent behavior and potential data corruption

## ✅ **Fixes Implemented**

### 1. **Database Schema Cleanup**
```sql
-- Remove redundant experience column
ALTER TABLE players DROP COLUMN experience;
```

### 2. **Enhanced `handle_new_user` Function**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_address TEXT;
  display_name TEXT;
  farcaster_fid INTEGER;
  username TEXT;
  avatar_url TEXT;
  user_email TEXT;
BEGIN
  -- Extract metadata with proper fallbacks
  wallet_address := NEW.raw_user_meta_data->>'wallet_address';
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    'Adventurer'
  );
  
  -- Handle Farcaster metadata (check multiple possible keys)
  farcaster_fid := COALESCE(
    (NEW.raw_user_meta_data->>'farcaster_fid')::INTEGER,
    (NEW.raw_user_meta_data->>'fid')::INTEGER,
    NULL
  );
  
  username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    'user_' || NEW.id::TEXT
  );
  
  avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Use the actual email from auth.users, not metadata
  user_email := NEW.email;
  
  -- Insert with proper data mapping
  INSERT INTO public.players (
    user_id, display_name, wallet_address, farcaster_fid,
    username, avatar_url, email, level, xp, coins, sparks,
    is_inspired, "needsAdventurerName", created_at, updated_at
  ) VALUES (
    NEW.id, display_name, wallet_address, farcaster_fid,
    username, avatar_url, user_email, 1, 0, 0, 0,
    false, true, NOW(), NOW()
  );
  
  -- Create default settings and inventory
  -- ... (rest of function)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. **Data Sync Functions**
```sql
-- Sync existing user emails
CREATE OR REPLACE FUNCTION sync_existing_user_emails()
RETURNS INTEGER AS $$
-- Updates players.email from auth.users.email where NULL

-- Update existing Farcaster users
CREATE OR REPLACE FUNCTION update_existing_farcaster_users()
RETURNS INTEGER AS $$
-- Updates Farcaster fields from auth.users metadata
```

### 4. **Enhanced API Integration**
```typescript
// In useWalletAuth.ts - signUpWithWallet function
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

// Add Farcaster metadata if available for Base App users
if (isBaseApp && baseAppUser) {
  if (baseAppUser.fid) {
    headers['x-farcaster-fid'] = baseAppUser.fid.toString();
  }
  if (baseAppUser.username) {
    headers['x-farcaster-username'] = baseAppUser.username;
  }
  if (baseAppUser.avatarUrl) {
    headers['x-farcaster-avatar-url'] = baseAppUser.avatarUrl;
  }
}
```

```typescript
// In wallet-signup API route
const userMetadata: any = {
  wallet_address: address.toLowerCase(),
  display_name: displayName,
};

// Check for Farcaster context from headers
const farcasterFid = request.headers.get('x-farcaster-fid');
const farcasterUsername = request.headers.get('x-farcaster-username');
const farcasterAvatarUrl = request.headers.get('x-farcaster-avatar-url');

if (farcasterFid) {
  userMetadata.farcaster_fid = farcasterFid;
}
// ... add other Farcaster fields
```

## 🔧 **Implementation Steps**

### 1. **Run Database Fix Script**
```bash
# Execute the comprehensive fix script
psql -h your-supabase-host -U postgres -d postgres -f supabase/fix_players_table_issues.sql
```

### 2. **Deploy Updated Code**
- Deploy the updated `useWalletAuth.ts` hook
- Deploy the updated `wallet-signup` API route
- Deploy the updated database functions

### 3. **Verify Fixes**
```sql
-- Check players table status
SELECT 
  COUNT(*) as total_players,
  COUNT(email) as players_with_email,
  COUNT(farcaster_fid) as players_with_fid,
  COUNT(username) as players_with_username,
  COUNT(avatar_url) as players_with_avatar
FROM players;
```

## 📊 **Expected Results**

### **Before Fixes**
- `experience` column exists (redundant)
- Farcaster fields show NULL values
- Email not synced between tables
- Inconsistent metadata extraction

### **After Fixes**
- ✅ `experience` column removed
- ✅ Farcaster fields populated from metadata
- ✅ Email properly synced from `auth.users`
- ✅ Consistent metadata extraction with fallbacks
- ✅ Base App users get proper Farcaster data during signup

## 🧪 **Testing**

### **Test Base App Signup**
1. Create account through Base App
2. Verify Farcaster metadata is captured
3. Check `players` table has proper values
4. Verify email sync works

### **Test Existing Users**
1. Run sync functions
2. Verify email addresses are populated
3. Check Farcaster data is updated

## 🚀 **Next Steps**

1. **Deploy the fix script** to production database
2. **Test Base App signup flow** to ensure metadata capture
3. **Monitor database logs** for any trigger function errors
4. **Verify data consistency** between `auth.users` and `players` tables

## 📝 **Notes**

- The `experience` column was redundant since we already have `xp`
- Farcaster metadata extraction now checks multiple possible key names
- Email sync ensures consistency between authentication and game data
- Base App integration now properly captures Farcaster context during signup
