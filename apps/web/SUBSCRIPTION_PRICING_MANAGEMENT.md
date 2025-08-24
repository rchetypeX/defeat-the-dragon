# Subscription Pricing Management Guide

## Overview

The subscription pricing system allows you to **centrally manage pricing** for all subscription types across all app instances. You can update prices, durations, benefits, and descriptions without needing to modify code or redeploy the application.

## Database Table: `subscription_pricing_master`

### Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subscription_type` | VARCHAR(50) | Unique identifier ('monthly', 'annual') |
| `price_eth` | DECIMAL(10,6) | Price in ETH (e.g., 0.002) |
| `price_usd` | DECIMAL(10,2) | Price in USD for reference |
| `duration_days` | INTEGER | Duration in days (30 for monthly, 365 for annual) |
| `is_active` | BOOLEAN | Whether this pricing is active |
| `description` | TEXT | Optional description |
| `benefits` | TEXT[] | Array of benefits for this subscription |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Current Pricing (Initial Setup)

| Subscription Type | Price (ETH) | Price (USD) | Duration | Status |
|-------------------|-------------|-------------|----------|--------|
| Monthly | 0.002 | $4.50 | 30 days | Active |
| Annual | 0.02 | $45.00 | 365 days | Active |

## How to Update Pricing

### Method 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Table Editor**
   - Select the `subscription_pricing_master` table

2. **Update Pricing**
   - Click on the row you want to edit
   - Modify the `price_eth`, `price_usd`, `duration_days`, or `benefits`
   - Click **Save** to apply changes

3. **Example: Increase Monthly Price**
   ```sql
   UPDATE subscription_pricing_master 
   SET price_eth = 0.003, 
       price_usd = 6.75,
       updated_at = NOW()
   WHERE subscription_type = 'monthly';
   ```

### Method 2: SQL Editor

1. **Open SQL Editor** in Supabase Dashboard
2. **Run SQL Commands** to update pricing:

```sql
-- Update monthly pricing
UPDATE subscription_pricing_master 
SET price_eth = 0.003, 
    price_usd = 6.75,
    description = 'Monthly Inspiration Boon - Updated Pricing',
    updated_at = NOW()
WHERE subscription_type = 'monthly';

-- Update annual pricing
UPDATE subscription_pricing_master 
SET price_eth = 0.025, 
    price_usd = 56.25,
    description = 'Annual Inspiration Boon - Updated Pricing',
    updated_at = NOW()
WHERE subscription_type = 'annual';

-- Update benefits
UPDATE subscription_pricing_master 
SET benefits = ARRAY[
  'Earn Sparks from successful focus sessions',
  'Access to exclusive shop items',
  'Monthly drops of Sparks-exclusive items',
  'Priority customer support'
],
updated_at = NOW()
WHERE subscription_type = 'monthly';
```

### Method 3: API Endpoint (Programmatic)

You can also update pricing programmatically using the API:

```bash
curl -X POST https://your-domain.com/api/master/subscription-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_type": "monthly",
    "price_eth": 0.003,
    "price_usd": 6.75,
    "duration_days": 30,
    "description": "Updated Monthly Pricing",
    "benefits": [
      "Earn Sparks from successful focus sessions",
      "Access to exclusive shop items",
      "Monthly drops of Sparks-exclusive items"
    ]
  }'
```

## Features

### ✅ **Automatic Updates**
- Changes take effect **immediately** across all app instances
- No code deployment required
- No app restart needed

### ✅ **Version Control**
- `created_at` and `updated_at` timestamps track changes
- Full audit trail of pricing modifications

### ✅ **Flexible Benefits**
- Dynamic benefits list that can be updated
- Support for different benefits per subscription type

### ✅ **Active/Inactive Control**
- Set `is_active = false` to temporarily disable a subscription type
- Useful for seasonal pricing or maintenance

### ✅ **Multi-Currency Support**
- ETH pricing for blockchain transactions
- USD pricing for reference and display

## Best Practices

### 1. **Test Changes First**
```sql
-- Test pricing changes on a copy
CREATE TABLE subscription_pricing_test AS 
SELECT * FROM subscription_pricing_master;

-- Make changes to test table first
UPDATE subscription_pricing_test 
SET price_eth = 0.003 
WHERE subscription_type = 'monthly';

-- Verify changes, then apply to production
UPDATE subscription_pricing_master 
SET price_eth = 0.003 
WHERE subscription_type = 'monthly';
```

### 2. **Backup Before Major Changes**
```sql
-- Create backup before major pricing changes
CREATE TABLE subscription_pricing_backup_20240101 AS 
SELECT * FROM subscription_pricing_master;
```

### 3. **Gradual Rollouts**
```sql
-- Temporarily disable old pricing
UPDATE subscription_pricing_master 
SET is_active = false 
WHERE subscription_type = 'monthly';

-- Add new pricing tier
INSERT INTO subscription_pricing_master (
  subscription_type, 
  price_eth, 
  price_usd, 
  duration_days, 
  description, 
  benefits
) VALUES (
  'monthly_premium', 
  0.004, 
  9.00, 
  30, 
  'Premium Monthly Inspiration Boon', 
  ARRAY[
    'Earn Sparks from successful focus sessions',
    'Access to exclusive shop items',
    'Monthly drops of Sparks-exclusive items',
    'Premium customer support',
    'Early access to new features'
  ]
);
```

### 4. **Monitor Changes**
```sql
-- Check recent pricing changes
SELECT 
  subscription_type,
  price_eth,
  price_usd,
  updated_at
FROM subscription_pricing_master 
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

## Troubleshooting

### Issue: Pricing Not Updating
**Solution**: Check if the pricing is active
```sql
SELECT subscription_type, is_active, price_eth 
FROM subscription_pricing_master 
WHERE subscription_type = 'monthly';
```

### Issue: Benefits Not Showing
**Solution**: Verify benefits array format
```sql
SELECT subscription_type, benefits 
FROM subscription_pricing_master 
WHERE subscription_type = 'monthly';
```

### Issue: API Not Responding
**Solution**: Check API endpoint status
```bash
curl https://your-domain.com/api/master/subscription-pricing
```

## Security

### Row Level Security (RLS)
- **Read Access**: All authenticated users can read active pricing
- **Write Access**: Only service role can modify pricing
- **Admin Protection**: Pricing changes require service role authentication

### Audit Trail
- All changes are timestamped
- Full history of pricing modifications
- No data loss during updates

## Monitoring

### Track Pricing Changes
```sql
-- Monitor pricing changes over time
SELECT 
  subscription_type,
  price_eth,
  price_usd,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))/86400 as days_since_creation
FROM subscription_pricing_master 
ORDER BY updated_at DESC;
```

### Usage Analytics
```sql
-- Track subscription purchases by pricing
SELECT 
  spm.subscription_type,
  spm.price_eth,
  COUNT(us.id) as total_subscriptions,
  SUM(CASE WHEN us.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions
FROM subscription_pricing_master spm
LEFT JOIN user_subscriptions us ON us.subscription_type = spm.subscription_type
GROUP BY spm.subscription_type, spm.price_eth;
```

## Support

For questions or issues with subscription pricing management:

1. **Check the logs** in Supabase Dashboard
2. **Verify API responses** using the endpoint
3. **Test pricing changes** in a development environment first
4. **Contact support** if issues persist

---

**Note**: Always test pricing changes in a development environment before applying to production. The system is designed to be safe and reversible, but it's best practice to verify changes before going live.
