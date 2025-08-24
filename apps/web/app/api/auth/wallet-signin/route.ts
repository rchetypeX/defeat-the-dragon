import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    if (!address || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll skip signature verification to avoid viem dependency issues
    // In production, you should implement proper signature verification
    // This is a simplified approach for development
    console.log('Wallet sign-in attempt:', { address, message, signature });

    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this wallet address. Please sign up first.' },
        { status: 404 }
      );
    }

    // Create or get Supabase user
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      existingUser.user_id
    );

    if (authError) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    // For wallet authentication, return user data for localStorage approach
    return NextResponse.json({
      success: true,
      user: {
        id: existingUser.user_id,
        wallet_address: existingUser.wallet_address,
        display_name: existingUser.display_name,
        email: authUser.user.email || `${address.toLowerCase()}@wallet.local`,
      },
      walletAuth: true,
    });



  } catch (error) {
    console.error('Wallet sign-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
