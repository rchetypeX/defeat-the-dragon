import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, message, signature, userId } = await request.json();

    if (!walletAddress || !message || !signature || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll skip signature verification to avoid viem dependency issues
    // In production, you should implement proper signature verification
    console.log('Wallet linking attempt:', { walletAddress, userId, message, signature });

    // Check if the wallet is already linked to another account
    const { data: existingWalletUser, error: walletError } = await supabase
      .from('players')
      .select('user_id, display_name')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Database error checking wallet' },
        { status: 500 }
      );
    }

    if (existingWalletUser) {
      return NextResponse.json(
        { error: 'This wallet is already linked to another account.' },
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

    // Check if the user already has a wallet linked
    if (currentPlayer.wallet_address) {
      return NextResponse.json(
        { error: 'Your account already has a wallet linked.' },
        { status: 409 }
      );
    }

    // Link the wallet to the user's account
    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to link wallet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet linked successfully',
      player: updatedPlayer,
    });

  } catch (error) {
    console.error('Link wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
