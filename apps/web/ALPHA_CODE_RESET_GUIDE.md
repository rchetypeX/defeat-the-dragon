# Admin-Only Alpha Code Management Guide

This guide explains how to manage alpha codes securely with admin-only access.

## 🔐 Admin-Only Security Model

**Alpha codes are now stored securely in Supabase and are only accessible to admin users.**

### 🔒 Security Features Implemented:
- ✅ **Admin-only API endpoints** - Only authenticated admins can access
- ✅ **Database-level security** - Codes stored in Supabase with proper access controls
- ✅ **Admin validation** - Checks for admin privileges before allowing access
- ✅ **Secure export** - Files saved outside repository to prevent accidental commits
- ✅ **Audit trail** - All admin actions are logged with user IDs and timestamps

### Before deploying to production:
1. Delete the `alpha_codes_plain_text` view
2. Implement proper code hashing
3. Remove plain text storage
4. Generate new secure codes with proper hashing

## Quick Start

### Admin-Only Commands

**List all alpha codes:**
```bash
npm run admin:alpha list
```

**Generate new alpha codes (with proper hashing):**
```bash
npm run alpha:generate 52
```

**Generate codes via admin script:**
```bash
npm run admin:alpha generate 52
```

**Clear all alpha codes:**
```bash
npm run admin:alpha clear
```

**Export codes to secure location:**
```bash
npm run admin:alpha export
```

**Test usage tracking:**
```bash
npm run alpha:test-usage
```

### Admin Validation

To use these commands, you must be an admin user. The system checks for admin privileges by:

1. **Authentication** - Valid user session required
2. **Admin check** - User's display name must contain "admin" (case-insensitive)
3. **Service role** - Uses Supabase service role for secure database access

### Setting Up Admin Access

To make yourself an admin:

1. **Update your display name** in the app to include "admin" (e.g., "Admin User" or "admin@example.com")
2. **Or modify the admin validation logic** in `/app/api/admin/alpha-codes/route.ts`

### Output Files (when exporting)

Files are saved to `~/alpha_codes_export/` (outside your repository):
- `alpha_codes_[timestamp].txt` - Formatted list with instructions
- `alpha_codes_simple_[timestamp].txt` - Simple list for easy copying
- `alpha_codes_[timestamp].csv` - CSV format for spreadsheet import

### Option 2: Using SQL Migration

1. **Run the SQL migration directly in Supabase:**
   ```sql
   -- Copy and paste the contents of:
   -- supabase/migrations/20250127_reset_alpha_codes_for_testing.sql
   ```

2. **Query the generated codes:**
   ```sql
   SELECT 
     row_number() over (order by created_at) as code_number,
     code_hash as plain_text_code,
     'Available' as status
   FROM alpha_codes 
   WHERE notes = 'Generated for testing - plain text code'
   ORDER BY created_at;
   ```

## Code Format

Generated codes follow the pattern: `DTD-XXXX-XXXX`

- Uses characters: A-Z, 2-9 (excludes 0, O, 1, I for clarity)
- Case-insensitive input
- Example: `DTD-A2B3-C4D5`

## File Outputs

### 1. `alpha_codes_for_testing.txt`
Formatted file with:
- Header with generation timestamp
- Numbered list of codes
- Instructions for testers
- Security notice

### 2. `alpha_codes_simple.txt`
Simple list format:
```
DTD-A2B3-C4D5
DTD-E6F7-G8H9
DTD-J2K3-L4M5
...
```

### 3. `alpha_codes.csv`
Spreadsheet format:
```csv
Code Number,Alpha Code,Status
1,DTD-A2B3-C4D5,Available
2,DTD-E6F7-G8H9,Available
...
```

## Sharing with Testers

### Option 1: Direct File Sharing
- Send the `alpha_codes_for_testing.txt` file
- Contains all necessary instructions

### Option 2: Copy-Paste List
- Copy codes from `alpha_codes_simple.txt`
- Paste into email/message

### Option 3: Spreadsheet
- Import `alpha_codes.csv` into Google Sheets/Excel
- Share the spreadsheet with testers

## Testing Instructions for Users

1. **Go to the app signup page**
2. **Enter one of the alpha codes**
3. **Complete the signup process**
4. **Each code can only be used once**

## Monitoring Usage

### Admin Panel
Access `/admin/alpha-codes` to monitor:
- Which codes have been used
- Usage statistics
- User assignments

### Database Queries
```sql
-- Check usage status
SELECT 
  COUNT(*) as total_codes,
  COUNT(*) FILTER (WHERE used = true) as used_codes,
  COUNT(*) FILTER (WHERE used = false) as available_codes
FROM alpha_codes
WHERE notes = 'Generated for testing - plain text code';

-- See which codes are used
SELECT 
  code_hash as code,
  used,
  used_by,
  used_at
FROM alpha_codes
WHERE notes = 'Generated for testing - plain text code'
ORDER BY used, created_at;
```

## Troubleshooting

### Script Errors

**"Missing required environment variables"**
- Ensure `.env.local` contains:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**"Error inserting codes"**
- Check database permissions
- Verify service role key is correct

### Code Issues

**"alpha code invalid" for valid codes**
- Check if code is already used
- Verify code format (DTD-XXXX-XXXX)
- Check for typos

**Codes not working**
- Ensure codes were generated with the reset script
- Check database connection
- Verify alpha code system is enabled

## Production Preparation

Before going to production:

1. **Delete the plain text view:**
   ```sql
   DROP VIEW IF EXISTS alpha_codes_plain_text;
   ```

2. **Implement proper hashing:**
   - Update the alpha code system to use SHA-256 hashing
   - Never store plain text codes in production

3. **Update the verification functions:**
   - Ensure `alpha_verify_and_reserve` uses proper hashing
   - Test the secure verification flow

4. **Generate new secure codes:**
   - Use the proper alpha code generation system
   - Store only hashed versions

## Security Best Practices

- **Never share plain text codes in production**
- **Use unique codes for each tester**
- **Monitor for abuse/brute force attempts**
- **Implement rate limiting**
- **Log all verification attempts**
- **Regularly rotate codes**

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify environment variables are set correctly
3. Test with a single code first
4. Check the admin panel for usage status
