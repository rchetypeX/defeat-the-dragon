import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('players')
      .select('id, display_name')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error checking account:', userError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const hasAccount = !!existingUser;

    return NextResponse.json({
      hasAccount,
      user: existingUser || null,
    });

  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
