# Supabase Integration Setup Guide

## Overview
CaseTrack has been migrated from localStorage to Supabase for secure, cloud-based data storage with user authentication.

## What Changed

### Previous System (localStorage)
- All data stored locally in browser
- No real authentication
- Data lost when browser cache cleared
- No data persistence across devices

### New System (Supabase)
- Cloud database for secure storage
- Proper user authentication with email/password
- Data persists across devices
- Row-Level Security ensures users can only access their own data
- Professional-grade security

## Environment Variables Required

The following environment variables need to be set in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### How to Get These Values:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "Settings" → "API"
4. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema

The following tables are automatically created:

### `users` (Managed by Supabase Auth)
- Stores user accounts created during registration

### `cases` Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- client_name: TEXT
- case_number: TEXT
- court_name: TEXT
- status: TEXT ('Active' or 'Closed')
- notes: TEXT (nullable)
- created_at: TIMESTAMP
```

### `hearing_dates` Table
```sql
- id: UUID (Primary Key)
- case_id: UUID (Foreign Key to cases)
- date: DATE
- time: TIME (nullable)
- notes: TEXT (nullable)
```

## Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view cases they created
- Users can only modify their own cases
- Users cannot access other users' data

## File Upload

Files are currently stored in browser localStorage as base64-encoded strings. This keeps files private to each browser session. Future enhancement: migrate to Supabase Storage for cloud-based file storage.

## Authentication Flow

1. **Sign Up**: New users create account with email/password
2. **Email Confirmation**: Supabase sends confirmation email (configure in dashboard)
3. **Sign In**: Users log in with registered credentials
4. **Auto-Login**: User session persists across page refreshes
5. **Sign Out**: Clears session and redirects to login

## API Hooks Available

### `useSupabaseAuth()`
```typescript
const { user, isLoading, error, signUp, signIn, signOut } = useSupabaseAuth();
```

### `useSupabaseCases(userId)`
```typescript
const {
  cases,
  isLoading,
  error,
  loadCases,
  addCase,
  updateCase,
  deleteCase,
  addHearingDate,
  updateHearingDate,
  deleteHearingDate,
} = useSupabaseCases(userId);
```

## Features Preserved

✅ All original features working with Supabase:
- Create, read, update, delete cases
- Multiple hearing dates per case
- Case sorting by next hearing
- Today's hearings view
- 7-day upcoming view
- Calendar view
- Timeline view
- Status filtering
- Search functionality
- Case and hearing notes
- File uploads (localStorage)

## Troubleshooting

### "Invalid credentials" during sign in
- Ensure you've registered first
- Check email spelling
- Passwords are case-sensitive

### "Failed to load cases"
- Verify Supabase URL and API key are correct
- Check internet connection
- Ensure RLS policies are configured correctly

### Environment variables not working
- Restart dev server after adding env vars
- Make sure to use `NEXT_PUBLIC_` prefix for client-side vars
- Check Vercel project settings → Environment Variables

## Next Steps

1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your project
2. Database tables are created automatically via the migration script
3. Test sign up and login
4. Create test cases to verify functionality

## Support

For Supabase issues, visit: https://supabase.com/docs
For CaseTrack issues, contact the development team.
