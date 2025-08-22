# Supabase Setup Guide

To use real Supabase data instead of placeholder data, follow these steps:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be set up

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Create Environment File

Create a file called `.env.local` in the `apps/web/` directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Set Up Database Schema

Run the SQL migrations in your Supabase SQL editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL from `supabase/migrations/20250820_initial_schema.sql`
3. Run the SQL from `supabase/migrations/20250820_fix_session_actions.sql`

## 5. Restart Development Server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## 6. Test

The application should now connect to your real Supabase database instead of using placeholder data.

## Troubleshooting

- Make sure the `.env.local` file is in the correct location (`apps/web/.env.local`)
- Ensure you've copied the correct credentials from your Supabase dashboard
- Check the browser console for any connection errors
- Verify that your Supabase project is active and not paused
