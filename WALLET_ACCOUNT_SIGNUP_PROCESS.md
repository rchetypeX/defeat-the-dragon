# Wallet Account Signup Process - New Requirements

## Overview

The wallet account signup process has been updated to **require email addresses** for all wallet users. This ensures better account security, recovery options, and cross-device access.

## New Process Flow

### 1. User Connects Wallet
- User clicks "Connect Wallet" button
- Wallet connection is established
- System checks if wallet address is already registered

### 2. Email Requirement Check
- **If wallet is NEW (no existing account):**
  - User MUST provide an email address
  - User MUST provide a display name
  - Signup cannot proceed without both

- **If wallet is EXISTING (already registered):**
  - User can sign in directly
  - No additional email entry required

### 3. Account Creation
- Email address is validated for format
- Email address is checked for uniqueness
- Wallet address is checked for uniqueness
- Account is created with both wallet and email linked

## Implementation Details

### Frontend Components

#### `WalletSignupForm.tsx`
- New component that handles wallet signup with email requirement
- Validates email format in real-time
- Auto-generates display name from wallet address
- Shows clear explanation of why email is required

#### `WalletLoginForm.tsx`
- Updated to show signup form modal when needed
- Automatically detects if user should sign up or sign in
- Integrates with new `WalletSignupForm` component

### Backend API Changes

#### `/api/auth/wallet-signup`
- **New required fields:** `email`, `displayName`
- **Removed:** Auto-generated `@wallet` email addresses
- **Added:** Email format validation
- **Added:** Email uniqueness check
- **Added:** Wallet address uniqueness check

### Database Schema Updates

#### New Migration: `enforce_wallet_email_requirement.sql`
- Updates `handle_new_user()` function to enforce email requirement
- Creates trigger to prevent wallet users without emails
- Updates RLS policies for proper access control
- Creates views to monitor wallet user email status

## User Experience

### For New Wallet Users
1. **Connect Wallet** → Wallet connects successfully
2. **Email Entry Required** → Must provide valid email address
3. **Display Name** → Must provide character name (2-20 characters)
4. **Account Creation** → Account created with both wallet and email linked

### For Existing Wallet Users
1. **Connect Wallet** → Wallet connects successfully
2. **Sign In** → Direct access to existing account
3. **No Email Entry** → Email already linked from previous signup

### For Email-Only Users
1. **Email/Password Signup** → Standard email-based account creation
2. **Optional Wallet Linking** → Can link wallet later for payments
3. **No Wallet Required** → Can use app without web3 wallet

## Settings Enforcement

### Wallet Users
- **Email linking is REQUIRED** for wallet accounts
- Settings show prominent warning if email not linked
- Cannot access certain features without linked email
- Clear instructions on how to link email

### Email Users
- **Wallet linking is OPTIONAL** for email accounts
- Can link wallet for USDC payments (Inspiration Boon)
- No enforcement of wallet requirement

## Benefits of New System

### Security & Recovery
- **Account Recovery:** Users can recover accounts if wallet is lost
- **Cross-Device Access:** Access account from any device
- **Backup Authentication:** Email serves as backup to wallet

### User Experience
- **Clear Requirements:** Users know exactly what's needed
- **Better Support:** Customer service can help via email
- **Notifications:** Important game updates via email

### Business Logic
- **Payment Integration:** Wallet linking enables USDC payments
- **User Retention:** Better account recovery reduces user churn
- **Data Quality:** Valid email addresses for user communication

## Migration Notes

### Existing Wallet Users
- Users with `@wallet` placeholder emails need to link real emails
- Settings interface guides users through email linking process
- No disruption to existing functionality

### Database Changes
- New trigger prevents wallet users without emails
- Updated RLS policies ensure proper access control
- New views help monitor compliance

## Error Handling

### Common Error Scenarios
1. **Invalid Email Format** → Clear validation message
2. **Email Already Exists** → Suggest using different email or signing in
3. **Wallet Already Exists** → Redirect to sign in
4. **Missing Required Fields** → Highlight which fields are needed

### User Guidance
- Clear error messages with actionable steps
- Helpful tooltips explaining requirements
- Progressive disclosure of information

## Testing Scenarios

### New Wallet Signup
- [ ] Connect wallet successfully
- [ ] Email validation works
- [ ] Display name validation works
- [ ] Account creation succeeds
- [ ] Email and wallet properly linked

### Existing Wallet Signin
- [ ] Connect wallet successfully
- [ ] Sign in works without email entry
- [ ] No duplicate account creation
- [ ] Proper error handling

### Email-Only Signup
- [ ] Standard email signup works
- [ ] No wallet requirement enforced
- [ ] Optional wallet linking available

### Settings Enforcement
- [ ] Wallet users see email requirement warning
- [ ] Email linking process works
- [ ] Settings show proper status

## Future Enhancements

### Potential Improvements
- **Email Verification:** Send confirmation emails to new wallet users
- **Two-Factor Auth:** Email as second factor for wallet transactions
- **Account Recovery:** Email-based password reset for wallet users
- **Notification System:** Email notifications for game events

### Monitoring & Analytics
- Track wallet user email linking completion rates
- Monitor signup conversion rates
- Analyze user behavior patterns
- Identify potential friction points

## Compliance & Security

### Data Protection
- Email addresses stored securely in Supabase auth
- Wallet addresses stored in players table
- Proper RLS policies ensure data isolation
- GDPR compliance for email data

### Authentication Security
- Wallet signature verification (when viem dependency resolved)
- Email uniqueness validation
- Proper session management
- Secure account recovery process

## Support & Documentation

### User Support
- Clear in-app guidance for email requirements
- Helpful error messages and tooltips
- Settings interface for account management
- FAQ section explaining the process

### Developer Support
- Comprehensive API documentation
- Database schema documentation
- Migration scripts and procedures
- Testing guidelines and scenarios

---

**Note:** This new process ensures that all wallet users have proper email addresses linked to their accounts, providing better security, recovery options, and user experience while maintaining the flexibility for email-only users to optionally link wallets for payments.
