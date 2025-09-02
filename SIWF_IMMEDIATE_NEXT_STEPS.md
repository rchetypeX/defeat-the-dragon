# 🚀 SIWF Immediate Next Steps
## Quick Reference Card

---

## **🎯 TODAY - Day 1**

### **1. Execute Database Migration**
```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f 20250127_add_siwf_support.sql
```

### **2. Verify Migration Success**
```bash
# Run the test script to confirm everything works:
psql -h your-supabase-host -U postgres -d postgres -f test_siwf_migration.sql
```

**Expected Output**: ✅ All tests should pass with green checkmarks

---

## **📝 TOMORROW - Day 2**

### **1. Update SIWFContext.tsx**
**File**: `apps/web/contexts/SIWFContext.tsx`  
**Task**: Complete the `linkSupabaseAccount` function

**Add this code**:
```typescript
// Create user_settings record
await supabase.from('user_settings').insert({
  user_id: newUser.id,
  sound_enabled: true,
  notifications_enabled: true,
  accessibility: { highContrast: false, dyslexiaFont: false, ttsEnabled: false },
  equipped_character: 'fighter',
  equipped_background: 'forest'
});

// Create default inventory
await supabase.from('user_inventory').insert([
  { user_id: newUser.id, item_id: 'fighter', item_type: 'character', equipped: true },
  { user_id: newUser.id, item_id: 'forest', item_type: 'background', equipped: true }
]);
```

### **2. Test SIWF Signup Flow**
1. Try signing up with a Farcaster account
2. Verify user profile is created in database
3. Check that inventory has default items

---

## **🔧 DAY 3-4**

### **1. Update Inventory API**
**File**: `apps/web/app/api/inventory/route.ts`  
**Task**: Add SIWF user authentication

**Add this code**:
```typescript
const getUserId = async (request: NextRequest) => {
  // ... existing wallet/Supabase logic ...
  
  // Add SIWF user detection
  const siwfUser = request.headers.get('x-siwf-user');
  if (siwfUser) {
    const { data: player } = await supabase
      .from('players')
      .select('user_id')
      .eq('farcaster_fid', siwfUser)
      .single();
    return player?.user_id;
  }
  
  return null;
};
```

### **2. Test Inventory API**
- Verify SIWF users can access inventory
- Check that default inventory is created
- Ensure no breaking changes for existing users

---

## **📱 DAY 5-6**

### **1. Update Character/Background Stores**
**Files**: 
- `apps/web/lib/characterStore.ts`
- `apps/web/lib/backgroundStore.ts`

**Task**: Add database sync integration

**Add this code to both stores**:
```typescript
useEffect(() => {
  if (user) {
    loadEquippedItems();
  }
}, [user]);

const loadEquippedItems = async () => {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('equipped_character, equipped_background')
    .eq('user_id', user.id)
    .single();
    
  if (settings) {
    setEquippedCharacter(settings.equipped_character);
    setEquippedBackground(settings.equipped_background);
  }
};
```

### **2. Test Store Integration**
- Verify stores sync with database
- Test page refresh maintains state
- Check SIWF user preferences are respected

---

## **✅ SUCCESS CHECKLIST - END OF WEEK 1**

- [ ] Database migration completed and verified
- [ ] SIWF users get complete profiles automatically
- [ ] Default inventory created for new SIWF users
- [ ] Character/background stores sync with database
- [ ] No breaking changes for existing users
- [ ] Basic SIWF authentication flow working

---

## **🚨 IF SOMETHING BREAKS**

### **Database Issues**
```sql
-- Check if migration ran successfully
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('farcaster_fid', 'username', 'avatar_url', 'email', 'experience');
```

### **Authentication Issues**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'players';
```

### **Rollback Plan**
```sql
-- If needed, remove Farcaster fields (WARNING: Data loss!)
ALTER TABLE players DROP COLUMN IF EXISTS farcaster_fid;
ALTER TABLE players DROP COLUMN IF EXISTS username;
ALTER TABLE players DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE players DROP COLUMN IF EXISTS email;
ALTER TABLE players DROP COLUMN IF EXISTS experience;
```

---

## **📞 GETTING HELP**

1. **Check the test script output** for specific error messages
2. **Review the full action plan** for detailed steps
3. **Check Supabase logs** for database errors
4. **Verify database permissions** and RLS settings

---

**Remember**: Start with the database migration - everything else depends on it!
