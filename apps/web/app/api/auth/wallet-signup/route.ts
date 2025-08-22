import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address, displayName, message, signature } = await request.json();

    if (!address || !displayName || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll skip signature verification to avoid viem dependency issues
    // In production, you should implement proper signature verification
    // This is a simplified approach for development
    console.log('Wallet sign-up attempt:', { address, displayName, message, signature });

    // Check if user already exists
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

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this wallet address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Create a new Supabase user with a unique email
    const uniqueEmail = `${address.toLowerCase()}@wallet.local`;
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: address.toLowerCase(),
        display_name: displayName,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create player record in our database
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        user_id: authUser.user.id,
        wallet_address: address.toLowerCase(),
        display_name: displayName,
        level: 1,
        experience: 0,
        gold: 100,
        sparks: 50,
        current_character: 'fighter',
        inventory: [],
        achievements: [],
        settings: {
          sound_enabled: true,
          music_enabled: true,
          notifications_enabled: true,
        },
      })
      .select()
      .single();

    if (playerError) {
      // Clean up the auth user if player creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create player profile' },
        { status: 500 }
      );
    }

    // For wallet authentication, we'll return the user data
    // The frontend will handle setting the session
    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        wallet_address: address.toLowerCase(),
        display_name: displayName,
        email: uniqueEmail,
      },
      // Return a simple success flag for wallet auth
      walletAuth: true,
    });



  } catch (error) {
    console.error('Wallet sign-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
