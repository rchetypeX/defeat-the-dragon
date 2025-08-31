# Subscription Stacking Feature

## Overview
The subscription system now supports **subscription stacking**, allowing users to purchase multiple subscriptions that extend their Inspiration Boon duration instead of overwriting it.

## How It Works

### Before (Old System)
- Users could only have one active subscription
- New subscriptions would overwrite existing ones
- Duration was not cumulative

### After (New System)
- Users can have multiple active subscriptions
- New subscriptions stack on top of existing ones
- Duration is cumulative and extends from the latest expiry date

## Examples

### Example 1: Monthly + Monthly
- **User buys**: 1 month subscription (30 days)
- **Later buys**: Another 1 month subscription (30 days)
- **Result**: 60 days total (30 + 30)
- **Timeline**: First expires in 30 days, second expires in 60 days

### Example 2: Annual + Monthly
- **User buys**: 1 year subscription (365 days)
- **Later buys**: 1 month subscription (30 days)
- **Result**: 395 days total (365 + 30)
- **Timeline**: First expires in 365 days, second expires in 395 days

### Example 3: Multiple Monthly
- **User buys**: 1 month subscription (30 days)
- **Later buys**: Another 1 month subscription (30 days)
- **Later buys**: Another 1 month subscription (30 days)
- **Result**: 90 days total (30 + 30 + 30)
- **Timeline**: Each expires 30 days after the previous

## Technical Implementation

### Database Changes
- **Table**: `user_subscriptions`
- **Change**: Added `id` column as primary key instead of `user_id`
- **Result**: Multiple subscriptions per user are now supported

### API Changes
- **Endpoint**: `/api/subscriptions/create`
- **Logic**: Checks existing subscriptions and calculates new expiry from latest date
- **Stacking**: New duration is added to the latest expiry date, not from current date

### Frontend Changes
- **Shop**: Shows current subscription status with remaining time
- **Indicator**: Displays stacked subscription count
- **Tips**: Dynamic messaging about stacking capabilities

## User Experience

### In the Shop
1. **Active Subscription**: Shows green indicator with remaining time
2. **Stacked Count**: Displays number of active subscriptions
3. **Remaining Time**: Shows total cumulative time remaining
4. **Stacking Tip**: Informs users they can extend by buying more

### Subscription Process
1. **First Purchase**: Creates subscription with standard duration
2. **Additional Purchases**: Extends existing subscription duration
3. **Confirmation**: User sees updated total remaining time

## Benefits

### For Users
- **Flexibility**: Can extend subscription anytime
- **Value**: Multiple purchases don't waste existing time
- **Clarity**: Clear visibility of total remaining time
- **Control**: Can stack different subscription types

### For Business
- **Retention**: Users can extend without losing existing time
- **Revenue**: Encourages additional purchases
- **Satisfaction**: Better user experience with flexible options

## Migration Notes

### Database Migration
Run the migration script: `supabase/fix_subscription_stacking.sql`

This script:
- Creates new table structure with proper primary key
- Migrates existing subscription data
- Sets up proper indexes and RLS policies
- Verifies the new structure

### Backward Compatibility
- Existing subscriptions are preserved
- API endpoints maintain same interface
- Frontend gracefully handles both old and new data

## Testing

### Test Scenarios
1. **New User**: First subscription works as before
2. **Existing User**: Second subscription extends duration
3. **Multiple Stacking**: Third, fourth, etc. subscriptions continue stacking
4. **Different Types**: Monthly and annual can be mixed
5. **Expired Subscriptions**: Only active subscriptions are considered for stacking

### Test Cases
```sql
-- Test subscription stacking
INSERT INTO user_subscriptions (user_id, subscription_type, status, expires_at)
VALUES 
  ('user-1', 'monthly', 'active', NOW() + INTERVAL '30 days'),
  ('user-1', 'monthly', 'active', NOW() + INTERVAL '60 days');

-- Verify stacking works
SELECT 
  user_id,
  COUNT(*) as subscription_count,
  MAX(expires_at) as latest_expiry
FROM user_subscriptions 
WHERE user_id = 'user-1' AND status = 'active'
GROUP BY user_id;
```

## Future Enhancements

### Potential Features
- **Bulk Purchase**: Buy multiple months at once
- **Auto-Renewal**: Automatic stacking of renewals
- **Subscription Management**: View and manage individual subscriptions
- **Gift Subscriptions**: Gift subscriptions to other users
- **Promotional Stacking**: Special deals for stacking multiple subscriptions

### Analytics
- **Stacking Patterns**: Track how users stack subscriptions
- **Revenue Impact**: Measure effect of stacking on revenue
- **User Behavior**: Understand subscription purchasing patterns
- **Retention Metrics**: Track user retention with stacking

## Support

### Common Questions
**Q: Can I stack different subscription types?**
A: Yes! Monthly and annual subscriptions can be mixed and stacked.

**Q: What happens if I buy a subscription that expires after my current one?**
A: The new subscription will extend from your current expiry date.

**Q: Can I see my individual subscriptions?**
A: Yes, the system tracks each subscription separately and shows total remaining time.

**Q: What if I want to cancel one subscription?**
A: Currently, all subscriptions are active until they expire. Future versions may support individual cancellation.

### Troubleshooting
- **Migration Issues**: Check database logs for constraint violations
- **Stacking Not Working**: Verify table structure has `id` as primary key
- **Time Calculation Errors**: Check timezone settings in database
- **RLS Policy Issues**: Ensure proper policies are in place for `user_subscriptions` table
