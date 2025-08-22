import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recoverMessageAddress } from 'viem';

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

    // Verify the signature
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

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

    // Create a session for the new user
    const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: authUser.user.id,
    });

    if (sessionError) {
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: session.session,
      user: {
        id: authUser.user.id,
        wallet_address: address.toLowerCase(),
        display_name: displayName,
      },
    });

  } catch (error) {
    console.error('Wallet sign-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
