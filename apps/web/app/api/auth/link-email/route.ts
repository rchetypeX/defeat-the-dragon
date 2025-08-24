import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, userId } = await request.json();

    if (!email || !password || !displayName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Email linking attempt:', { email, displayName, userId });

    // Check if the email is already linked to another account
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already linked to another account.' },
        { status: 409 }
      );
    }



    // Get the current user's player data
    const { data: currentPlayer, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (playerError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user already has an email linked (by checking if they have a real email, not wallet.local)
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email && !authUser.user.email.endsWith('@wallet.local')) {
      return NextResponse.json(
        { error: 'Your account already has an email linked.' },
        { status: 409 }
      );
    }

    // Create a new Supabase user with the email
    const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        wallet_address: currentPlayer.wallet_address,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to create email account' },
        { status: 500 }
      );
    }

    // Update the existing player record to link to the new auth user
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({ 
        user_id: newAuthUser.user.id,
        display_name: displayName 
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      // Clean up the new auth user if update fails
      await supabase.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: 'Failed to link email' },
        { status: 500 }
      );
    }

    // Delete the old auth user (the wallet.local one)
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'Email linked successfully',
      player: updatedPlayer,
      newUserId: newAuthUser.user.id,
    });

  } catch (error) {
    console.error('Link email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
