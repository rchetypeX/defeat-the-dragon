# Alpha Code System Documentation

## Overview

The Alpha Code System provides secure, race-safe access control for the Defeat the Dragon app. It implements a two-step verification process that prevents race conditions and ensures proper attribution of codes to users.

## Features

- **Secure Code Storage**: Codes are hashed using SHA-256, never stored in plaintext
- **Race-Safe Verification**: Two-step process prevents multiple users from using the same code
- **Rate Limiting**: Built-in protection against brute force attacks
- **Admin Management**: Complete admin panel for code generation and management
- **Audit Trail**: Logs all attempts for security monitoring
- **Automatic Cleanup**: Removes stale reservations and old attempt logs

## Database Schema

### Tables

#### `alpha_codes`
- `id`: UUID primary key
- `code_hash`: SHA-256 hash of the normalized code (unique)
- `used`: Boolean indicating if code has been used
- `reserved_token`: Temporary UUID for pre-signup reservation
- `reserved_until`: Timestamp when reservation expires
- `used_by`: UUID of user who used the code
- `used_at`: Timestamp when code was used
- `expires_at`: Optional expiration date for the code
- `notes`: Optional admin notes
- `created_at`: Timestamp when code was created

#### `alpha_code_attempts`
- `id`: UUID primary key
- `ip_address`: IP address of attempt
- `user_agent`: Browser user agent
- `code_hash`: Hash of attempted code
- `success`: Boolean indicating if attempt was successful
- `created_at`: Timestamp of attempt

### Views

#### `alpha_codes_summary`
Provides counts of used vs available codes for admin dashboard.

### Functions

#### `alpha_verify_and_reserve(p_code text)`
- **Purpose**: Verify code and create temporary reservation
- **Access**: Anonymous users
- **Returns**: `{ reserved_token, reserved_until }`
- **Security**: Rate limited, logs attempts

#### `alpha_finalize_with_token(p_token uuid)`
- **Purpose**: Finalize code usage after successful signup
- **Access**: Authenticated users only
- **Returns**: Boolean success indicator

#### `alpha_add_codes(p_codes text[])`
- **Purpose**: Add multiple codes to database
- **Access**: Service role only
- **Returns**: Number of codes successfully added

#### `cleanup_old_alpha_attempts()`
- **Purpose**: Remove attempt logs older than 7 days
- **Access**: Service role only
- **Returns**: Number of records deleted

## Code Format

Alpha codes follow the pattern: `DTD-XXXX-XXXX`

- Uses characters: A-Z, 2-9 (excludes 0, O, 1, I for clarity)
- Case-insensitive input
- Spaces and dashes are automatically removed
- Example: `DTD-A2B3-C4D5`

## User Flow

### 1. Code Verification (Anonymous)
```
User enters code → API validates → Code reserved for 5 minutes → Returns reservation token
```

### 2. Account Creation
```
User fills signup form → Creates account → Finalizes code usage → Account activated
```

### 3. Error Handling
- Invalid codes return generic "alpha code invalid" message
- Expired reservations require re-verification
- Rate limiting prevents abuse

## API Endpoints

### POST `/api/alpha/verify`
**Request:**
```json
{
  "code": "DTD-A2B3-C4D5"
}
```

**Response:**
```json
{
  "reserved_token": "uuid",
  "reserved_until": "2024-01-01T12:00:00Z"
}
```

### POST `/api/alpha/finalize`
**Request:**
```json
{
  "reserved_token": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

## Admin Panel

Access the admin panel at `/admin/alpha-codes` to:

- View all alpha codes and their status
- Generate new codes in batches
- Monitor usage statistics
- Clean up old attempt logs
- View detailed audit trail

## Security Features

### Rate Limiting
- Maximum 5 attempts per minute per IP
- Client-side debouncing (1 second minimum between attempts)
- Server-side attempt logging

### Code Security
- Codes are hashed using SHA-256
- Plaintext codes are never stored in database
- Normalization prevents case/format variations

### Race Condition Prevention
- Atomic reservation with single UPDATE query
- 5-minute reservation window
- Automatic cleanup of expired reservations

### Audit Trail
- All attempts logged with IP and user agent
- Success/failure tracking
- Automatic cleanup of old logs

## Implementation Steps

### 1. Database Setup
Run the migration file:
```sql
-- Execute: supabase/migrations/20250101_add_alpha_codes.sql
```

### 2. Generate Initial Codes
Use the code generator utility:
```typescript
import { generateAndAddCodes } from './lib/alphaCodeGenerator';

const result = await generateAndAddCodes(
  100, // number of codes
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 3. Test the Flow
1. Generate test codes
2. Try signup with valid code
3. Verify code is marked as used
4. Test with invalid/expired codes

## Monitoring

### Key Metrics to Track
- Codes used vs available
- Failed attempt patterns
- Reservation expiration rates
- Signup completion rates

### Dashboard Queries
```sql
-- Usage summary
SELECT * FROM alpha_codes_summary;

-- Recent attempts
SELECT * FROM alpha_code_attempts 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Failed attempts by IP
SELECT ip_address, COUNT(*) 
FROM alpha_code_attempts 
WHERE success = false 
GROUP BY ip_address 
ORDER BY COUNT(*) DESC;
```

## Troubleshooting

### Common Issues

**"alpha code invalid" for valid codes**
- Check if code is already used
- Verify reservation hasn't expired
- Check rate limiting

**Codes not being marked as used**
- Verify finalization API is called after signup
- Check authentication status
- Review server logs for errors

**Admin panel access issues**
- Ensure service role permissions
- Check RLS policies
- Verify admin authentication

### Debug Queries
```sql
-- Check specific code status
SELECT * FROM alpha_codes WHERE code_hash = 'hash_here';

-- View recent reservations
SELECT * FROM alpha_codes 
WHERE reserved_until > now() 
ORDER BY reserved_until DESC;

-- Check attempt patterns
SELECT ip_address, COUNT(*) as attempts, 
       COUNT(*) FILTER (WHERE success = true) as successes
FROM alpha_code_attempts 
WHERE created_at > now() - interval '1 hour'
GROUP BY ip_address;
```

## Best Practices

### Code Distribution
- Generate codes in batches
- Use secure channels for distribution
- Track which codes are sent to whom
- Set expiration dates for time-sensitive codes

### Monitoring
- Set up alerts for unusual attempt patterns
- Monitor signup completion rates
- Track code usage analytics
- Regular cleanup of old data

### Security
- Never log plaintext codes
- Use HTTPS for all API calls
- Implement proper rate limiting
- Regular security audits

## Future Enhancements

- **Bulk Operations**: Import/export codes via CSV
- **Advanced Analytics**: Detailed usage reports
- **Code Categories**: Different code types for different purposes
- **Integration**: Webhook notifications for code usage
- **Mobile Support**: QR code generation for easy distribution
