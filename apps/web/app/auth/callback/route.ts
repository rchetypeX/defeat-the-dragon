import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful authentication, redirect to the app
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}${next}`);
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/?error=auth_callback_failed`);
}
