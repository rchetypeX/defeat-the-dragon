# Level Progression Management Guide

## Overview

The level progression system allows you to **centrally manage XP requirements** for each level across all app instances. You can update XP requirements, level descriptions, and rewards without needing to modify code or redeploy the application.

## Database Table: `level_progression_master`

### Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `level` | INTEGER | Level number (1, 2, 3, etc.) |
| `xp_to_next` | INTEGER | XP required to reach the next level |
| `cumulative_xp` | INTEGER | Total XP required to reach this level |
| `is_active` | BOOLEAN | Whether this level is active |
| `description` | TEXT | Optional description for this level |
| `rewards` | TEXT[] | Array of rewards for reaching this level |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Current Level Progression (Initial Setup)

| Level | XP to Next | Cumulative XP | Description |
|-------|------------|---------------|-------------|
| 1 | 50 | 0 | Level 1 - Beginner Adventurer |
| 2 | 83 | 50 | Level 2 - Novice Explorer |
| 3 | 117 | 133 | Level 3 - Apprentice Warrior |
| 4 | 150 | 250 | Level 4 - Skilled Fighter |
| 5 | 183 | 400 | Level 5 - Experienced Hero |
| ... | ... | ... | ... |
| 99 | 3317 | 163333 | Level 99 - Endless Warrior |

## How to Update Level Progression

### Method 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Table Editor**
   - Select the `level_progression_master` table

2. **Update Level Progression**
   - Click on the row you want to edit
   - Modify the `xp_to_next`, `cumulative_xp`, `description`, or `rewards`
   - Click **Save** to apply changes

3. **Example: Adjust Level 5 XP Requirements**
   ```sql
   UPDATE level_progression_master 
   SET xp_to_next = 200, 
       cumulative_xp = 450,
       description = 'Level 5 - Heroic Champion',
       updated_at = NOW()
   WHERE level = 5;
   ```

### Method 2: SQL Editor

1. **Open SQL Editor** in Supabase Dashboard
2. **Run SQL Commands** to update level progression:

```sql
-- Update specific level
UPDATE level_progression_master 
SET xp_to_next = 200, 
    cumulative_xp = 450,
    description = 'Level 5 - Heroic Champion',
    updated_at = NOW()
WHERE level = 5;

-- Update multiple levels at once
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 1.2, -- Increase XP requirements by 20%
    updated_at = NOW()
WHERE level BETWEEN 10 AND 20;

-- Add rewards to a level
UPDATE level_progression_master 
SET rewards = ARRAY[
  'Unlock new character class',
  'Gain 100 bonus coins',
  'Access to exclusive shop items'
],
updated_at = NOW()
WHERE level = 10;

-- Disable a level temporarily
UPDATE level_progression_master 
SET is_active = false,
    updated_at = NOW()
WHERE level = 100;
```

### Method 3: API Endpoint (Programmatic)

You can also update level progression programmatically using the API:

```bash
curl -X POST https://your-domain.com/api/master/level-progression \
  -H "Content-Type: application/json" \
  -d '{
    "level": 5,
    "xp_to_next": 200,
    "cumulative_xp": 450,
    "description": "Level 5 - Heroic Champion",
    "rewards": [
      "Unlock new character class",
      "Gain 100 bonus coins"
    ]
  }'
```

## Features

### ✅ **Automatic Updates**
- Changes take effect **immediately** across all app instances
- No code deployment required
- No app restart needed

### ✅ **Flexible XP Curves**
- **Linear**: Each level requires the same additional XP
- **Exponential**: XP requirements increase with each level
- **Custom**: Any XP curve you design
- **Hybrid**: Different curves for different level ranges

### ✅ **Level Descriptions**
- Dynamic level titles and descriptions
- Can be updated without code changes
- Supports rich text and emojis

### ✅ **Level Rewards**
- Array of rewards for reaching each level
- Can include coins, items, abilities, etc.
- Easy to modify and expand

### ✅ **Active/Inactive Control**
- Set `is_active = false` to temporarily disable levels
- Useful for seasonal events or maintenance
- Players can't progress beyond inactive levels

## Best Practices

### 1. **Test Changes First**
```sql
-- Test level progression changes on a copy
CREATE TABLE level_progression_test AS 
SELECT * FROM level_progression_master;

-- Make changes to test table first
UPDATE level_progression_test 
SET xp_to_next = 200 
WHERE level = 5;

-- Verify changes, then apply to production
UPDATE level_progression_master 
SET xp_to_next = 200 
WHERE level = 5;
```

### 2. **Backup Before Major Changes**
```sql
-- Create backup before major progression changes
CREATE TABLE level_progression_backup_20240101 AS 
SELECT * FROM level_progression_master;
```

### 3. **Gradual Progression Adjustments**
```sql
-- Increase XP requirements gradually
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 1.1, -- 10% increase
    updated_at = NOW()
WHERE level BETWEEN 1 AND 50;

-- Wait and monitor, then adjust further if needed
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 1.05, -- Additional 5% increase
    updated_at = NOW()
WHERE level BETWEEN 1 AND 50;
```

### 4. **Monitor Player Progress**
```sql
-- Check player distribution across levels
SELECT 
  lpm.level,
  lpm.xp_to_next,
  COUNT(p.id) as player_count
FROM level_progression_master lpm
LEFT JOIN players p ON p.level = lpm.level
WHERE lpm.is_active = true
GROUP BY lpm.level, lpm.xp_to_next
ORDER BY lpm.level;
```

## Common Use Cases

### **Balancing Game Difficulty**
```sql
-- Make early levels easier
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 0.8, -- 20% reduction
    updated_at = NOW()
WHERE level BETWEEN 1 AND 10;

-- Make later levels more challenging
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 1.3, -- 30% increase
    updated_at = NOW()
WHERE level BETWEEN 50 AND 99;
```

### **Seasonal Events**
```sql
-- Reduce XP requirements during special events
UPDATE level_progression_master 
SET xp_to_next = xp_to_next * 0.7, -- 30% reduction
    updated_at = NOW()
WHERE level BETWEEN 1 AND 99;

-- Add special rewards for event levels
UPDATE level_progression_master 
SET rewards = ARRAY[
  'Event-exclusive character skin',
  'Double coins for 24 hours',
  'Special achievement badge'
],
updated_at = NOW()
WHERE level = 25;
```

### **New Player Experience**
```sql
-- Make first 5 levels very easy
UPDATE level_progression_master 
SET xp_to_next = 25, -- Very low XP requirement
    description = 'Level ' || level || ' - Welcome New Hero!',
    updated_at = NOW()
WHERE level BETWEEN 1 AND 5;
```

## Troubleshooting

### Issue: Level Progression Not Updating
**Solution**: Check if the level is active
```sql
SELECT level, is_active, xp_to_next 
FROM level_progression_master 
WHERE level = 5;
```

### Issue: Players Stuck at Level
**Solution**: Verify cumulative XP values
```sql
SELECT level, xp_to_next, cumulative_xp 
FROM level_progression_master 
WHERE level BETWEEN 4 AND 6
ORDER BY level;
```

### Issue: API Not Responding
**Solution**: Check API endpoint status
```bash
curl https://your-domain.com/api/master/level-progression
```

## Monitoring

### Track Level Progression Changes
```sql
-- Monitor progression changes over time
SELECT 
  level,
  xp_to_next,
  cumulative_xp,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))/86400 as days_since_creation
FROM level_progression_master 
ORDER BY updated_at DESC;
```

### Player Distribution Analysis
```sql
-- Analyze player distribution across levels
SELECT 
  lpm.level,
  lpm.xp_to_next,
  COUNT(p.id) as player_count,
  AVG(p.xp) as avg_xp
FROM level_progression_master lpm
LEFT JOIN players p ON p.level = lpm.level
WHERE lpm.is_active = true
GROUP BY lpm.level, lpm.xp_to_next
ORDER BY lpm.level;
```

### Level Completion Rates
```sql
-- Track how many players reach each level
SELECT 
  level,
  COUNT(*) as players_at_level,
  LAG(COUNT(*)) OVER (ORDER BY level) as players_at_previous_level,
  ROUND(
    (COUNT(*)::float / LAG(COUNT(*)) OVER (ORDER BY level)::float) * 100, 
    2
  ) as completion_rate_percent
FROM players 
GROUP BY level 
ORDER BY level;
```

## Security

### Row Level Security (RLS)
- **Read Access**: All authenticated users can read active level progression
- **Write Access**: Only service role can modify level progression
- **Admin Protection**: Progression changes require service role authentication

### Audit Trail
- All changes are timestamped
- Full history of progression modifications
- No data loss during updates

## Support

For questions or issues with level progression management:

1. **Check the logs** in Supabase Dashboard
2. **Verify API responses** using the endpoint
3. **Test progression changes** in a development environment first
4. **Monitor player feedback** after making changes
5. **Contact support** if issues persist

---

**Note**: Always test level progression changes in a development environment before applying to production. The system is designed to be safe and reversible, but it's best practice to verify changes before going live.

## Advanced Features

### **Dynamic Level Calculation**
The system automatically calculates:
- Current level based on total XP
- Progress to next level (0-100%)
- XP required for next level
- Level-up eligibility

### **Caching System**
- Level progression data is cached for 5 minutes
- Reduces API calls and improves performance
- Automatically refreshes when data changes

### **Fallback System**
- If API is unavailable, uses cached data
- Graceful degradation ensures app continues working
- No disruption to player experience
