# SIWF Implementation Action Plan
## Defeat The Dragon - Farcaster Integration

**Project Timeline**: 2-3 weeks  
**Priority**: High - Critical for user acquisition  
**Dependencies**: Database migration completed first

---

## 🚨 **PHASE 1: HIGH PRIORITY UPDATES (Week 1)**

### **1.1 Database Schema: Add Farcaster Fields to Players Table**
**Status**: ✅ **COMPLETED** - Migration script ready  
**Action**: Run the database migration  
**Owner**: DevOps/Database Admin  
**Timeline**: Day 1  

**Tasks**:
- [x] Create migration script (`20250127_add_siwf_support.sql`)
- [x] Create test script (`test_siwf_migration.sql`)
- [ ] **Execute migration in production**
- [ ] **Verify migration success**
- [ ] **Run test script to confirm all fields exist**

**Success Criteria**:
- All 5 Farcaster fields added to `players` table
- Indexes created successfully
- RLS policies updated
- Functions created and working

---

### **1.2 SIWF Context: Complete User Profile Creation**
**Status**: 🔄 **IN PROGRESS** - Basic structure exists, needs completion  
**Owner**: Frontend Developer  
**Timeline**: Days 2-4  

**Tasks**:
- [ ] **Update `SIWFContext.tsx` to create complete user profiles**
- [ ] **Add automatic user settings creation**
- [ ] **Add automatic inventory creation**
- [ ] **Handle Farcaster metadata extraction**
- [ ] **Add error handling for profile creation failures**

**Code Changes Needed**:
```typescript
// In SIWFContext.tsx - expand linkSupabaseAccount function
const linkSupabaseAccount = useCallback(async (email: string, displayName?: string) => {
  // ... existing code ...
  
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
});
```

**Success Criteria**:
- SIWF users get complete profiles automatically
- Default settings created (sound, notifications, accessibility)
- Default inventory created (fighter + forest)
- Error handling for failed profile creation

---

### **1.3 Inventory API: SIWF User Authentication Support**
**Status**: 🔄 **IN PROGRESS** - Basic structure exists, needs SIWF support  
**Owner**: Backend Developer  
**Timeline**: Days 3-5  

**Tasks**:
- [ ] **Update `/api/inventory/route.ts` to handle SIWF users**
- [ ] **Add SIWF user detection logic**
- [ ] **Update authentication flow for Farcaster users**
- [ ] **Test inventory creation for SIWF users**

**Code Changes Needed**:
```typescript
// In /api/inventory/route.ts
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

**Success Criteria**:
- SIWF users can access inventory API
- Default inventory created automatically
- Authentication works for all user types
- No breaking changes for existing users

---

### **1.4 Character/Background Stores: Database Sync Integration**
**Status**: 🔄 **IN PROGRESS** - Stores exist but not syncing with database  
**Owner**: Frontend Developer  
**Timeline**: Days 4-6  

**Tasks**:
- [ ] **Update `characterStore.ts` to sync with database**
- [ ] **Update `backgroundStore.ts` to sync with database**
- [ ] **Add database loading on initialization**
- [ ] **Handle SIWF user preferences**

**Code Changes Needed**:
```typescript
// In characterStore.ts and backgroundStore.ts
useEffect(() => {
  if (user) {
    // Load equipped items from database
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

**Success Criteria**:
- Character/background stores sync with database
- SIWF user preferences are respected
- No data loss on page refresh
- Consistent state across devices

---

## 🔶 **PHASE 2: MEDIUM PRIORITY UPDATES (Week 2)**

### **2.1 Shop System: SIWF User Purchase Support**
**Status**: ⏳ **NOT STARTED**  
**Owner**: Backend Developer  
**Timeline**: Days 8-10  

**Tasks**:
- [ ] **Update shop API to authenticate SIWF users**
- [ ] **Add SIWF user purchase history tracking**
- [ ] **Update `user_purchases` table policies**
- [ ] **Test purchase flow for SIWF users**

**Code Changes Needed**:
```typescript
// In shop API routes
const authenticateSIWFUser = async (request: NextRequest) => {
  const siwfUser = request.headers.get('x-siwf-user');
  if (siwfUser) {
    // Authenticate via Farcaster FID
    return await getUserIdByFarcasterFID(siwfUser);
  }
  return null;
};
```

**Success Criteria**:
- SIWF users can purchase items
- Purchase history tracked correctly
- Currency system works for all users
- No authentication errors

---

### **2.2 Session Management: SIWF User Session Tracking**
**Status**: ⏳ **NOT STARTED**  
**Owner**: Backend Developer  
**Timeline**: Days 10-12  

**Tasks**:
- [ ] **Update session API to handle SIWF users**
- [ ] **Add SIWF user session authentication**
- [ ] **Update session rewards for Farcaster users**
- [ ] **Test session completion flow**

**Code Changes Needed**:
```typescript
// In session API routes
const getSessionUserId = async (request: NextRequest) => {
  // Check for SIWF user first
  const siwfUser = request.headers.get('x-siwf-user');
  if (siwfUser) {
    return await getUserIdByFarcasterFID(siwfUser);
  }
  
  // Fall back to existing auth methods
  return await getExistingUserId(request);
};
```

**Success Criteria**:
- SIWF users can start/complete sessions
- XP and rewards tracked correctly
- Level progression works
- Session history maintained

---

### **2.3 Data Sync: SIWF User Data Consistency**
**Status**: ⏳ **NOT STARTED**  
**Owner**: Full Stack Developer  
**Timeline**: Days 12-14  

**Tasks**:
- [ ] **Update `syncService.ts` to handle SIWF users**
- [ ] **Add SIWF user data loading**
- [ ] **Update bootstrap endpoint for Farcaster users**
- [ ] **Test cross-device sync**

**Code Changes Needed**:
```typescript
// In syncService.ts
const loadSIWFUserData = async (farcasterFid: number) => {
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('farcaster_fid', farcasterFid)
    .single();
    
  if (player) {
    // Load all related data
    await loadUserDataByUserId(player.user_id);
  }
};
```

**Success Criteria**:
- SIWF user data syncs across devices
- Bootstrap endpoint returns complete data
- No data inconsistencies
- Performance maintained

---

## 🔵 **PHASE 3: LOW PRIORITY UPDATES (Week 3)**

### **3.1 UI Components: Minor Display Adjustments**
**Status**: ⏳ **NOT STARTED**  
**Owner**: Frontend Developer  
**Timeline**: Days 15-17  

**Tasks**:
- [ ] **Add Farcaster user indicators in UI**
- [ ] **Update user profile displays**
- [ ] **Add Farcaster-specific styling**
- [ ] **Test UI responsiveness**

**Code Changes Needed**:
```typescript
// In user profile components
const UserProfile = ({ user }) => {
  const isSIWFUser = user.farcaster_fid != null;
  
  return (
    <div className={`user-profile ${isSIWFUser ? 'siwf-user' : ''}`}>
      {isSIWFUser && <FarcasterBadge />}
      {/* Rest of profile content */}
    </div>
  );
};
```

**Success Criteria**:
- SIWF users clearly identified in UI
- Consistent styling across components
- No layout breaking changes
- Enhanced user experience

---

### **3.2 Error Handling: Better SIWF-Specific Error Messages**
**Status**: ⏳ **NOT STARTED**  
**Owner**: Full Stack Developer  
**Timeline**: Days 17-19  

**Tasks**:
- [ ] **Add SIWF-specific error messages**
- [ ] **Improve error logging for Farcaster users**
- [ ] **Add user-friendly error handling**
- [ ] **Test error scenarios**

**Code Changes Needed**:
```typescript
// In error handling utilities
const getSIWFErrorMessage = (error: Error, context: string) => {
  if (error.message.includes('farcaster_fid')) {
    return 'Unable to verify your Farcaster account. Please try signing in again.';
  }
  
  if (context === 'inventory') {
    return 'Unable to load your inventory. Please refresh the page.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};
```

**Success Criteria**:
- Clear error messages for SIWF users
- Better debugging information
- Improved user experience
- Reduced support tickets

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Week 1 - High Priority**
- [ ] **Day 1**: Run database migration
- [ ] **Day 2-4**: Complete SIWF context profile creation
- [ ] **Day 3-5**: Update inventory API for SIWF users
- [ ] **Day 4-6**: Integrate character/background stores with database

### **Week 2 - Medium Priority**
- [ ] **Day 8-10**: Add shop system SIWF support
- [ ] **Day 10-12**: Update session management for SIWF users
- [ ] **Day 12-14**: Implement SIWF data sync

### **Week 3 - Low Priority**
- [ ] **Day 15-17**: UI component adjustments
- [ ] **Day 17-19**: Error handling improvements
- [ ] **Day 20**: Final testing and documentation

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- [ ] Test SIWF context functions
- [ ] Test inventory API endpoints
- [ ] Test character/background store sync
- [ ] Test shop authentication

### **Integration Tests**
- [ ] Test complete SIWF user flow
- [ ] Test inventory creation
- [ ] Test session management
- [ ] Test data synchronization

### **User Acceptance Tests**
- [ ] Test with real Farcaster accounts
- [ ] Verify game features work normally
- [ ] Test cross-device functionality
- [ ] Performance testing

---

## 🚨 **RISK MITIGATION**

### **High Risk Items**
1. **Database Migration**: Run in staging first, have rollback plan
2. **Authentication Changes**: Test thoroughly to avoid breaking existing users
3. **Data Sync**: Ensure no data loss during implementation

### **Mitigation Strategies**
1. **Staging Environment**: Test all changes before production
2. **Feature Flags**: Use feature flags to gradually roll out changes
3. **Monitoring**: Add comprehensive logging and monitoring
4. **Rollback Plan**: Document rollback procedures for each phase

---

## 📊 **SUCCESS METRICS**

### **Technical Metrics**
- [ ] All SIWF users can authenticate successfully
- [ ] 100% of new SIWF users get complete profiles
- [ ] Inventory system works for all user types
- [ ] No performance degradation

### **User Experience Metrics**
- [ ] SIWF signup completion rate > 95%
- [ ] User error rate < 2%
- [ ] Game feature usage parity between user types
- [ ] Positive user feedback

---

## 🔄 **POST-IMPLEMENTATION**

### **Monitoring & Maintenance**
- [ ] Monitor SIWF user adoption
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Plan future enhancements

### **Documentation Updates**
- [ ] Update API documentation
- [ ] Update user guides
- [ ] Update developer documentation
- [ ] Create troubleshooting guides

---

## 📞 **RESOURCES & SUPPORT**

### **Team Members**
- **Project Lead**: [Name] - Overall coordination
- **Database Admin**: [Name] - Migration execution
- **Backend Developer**: [Name] - API updates
- **Frontend Developer**: [Name] - UI/UX changes
- **QA Engineer**: [Name] - Testing coordination

### **External Dependencies**
- **Farcaster Auth Kit**: Latest version
- **Supabase**: Database access and permissions
- **Testing Tools**: Jest, Cypress, etc.

---

**Last Updated**: January 27, 2025  
**Next Review**: Weekly during implementation  
**Project Status**: 🟡 **PLANNING PHASE**
