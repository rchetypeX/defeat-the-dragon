import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address, displayName } = await request.json();

    if (!address || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Simple wallet sign-up attempt:', { address, displayName });

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('players')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', userError);
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
    
    console.log('Creating auth user with email:', uniqueEmail);
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: uniqueEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: address.toLowerCase(),
        display_name: displayName,
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Create player record
    const playerResult = await supabase
      .from('players')
      .insert({
        user_id: authUser.user.id,
        wallet_address: address.toLowerCase(),
        display_name: displayName,
        level: 1,
        xp: 0,
        coins: 100,
        sparks: 50,
      })
      .select()
      .single();

    if (playerResult.error) {
      // Clean up the auth user if player creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.error('Player creation error:', playerResult.error);
      return NextResponse.json(
        { error: 'Failed to create player profile' },
        { status: 500 }
      );
    }

    console.log('Player record created successfully');

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        address: address.toLowerCase(),
        wallet_address: address.toLowerCase(),
        display_name: displayName,
        email: uniqueEmail,
      },
      walletAuth: true,
    });

  } catch (error) {
    console.error('Simple wallet sign-up error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
