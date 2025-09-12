import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Check if a player exists with this wallet address
    const { data: player, error } = await supabase
      .from('players')
      .select('id, user_id, display_name, wallet_address, farcaster_fid')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking wallet player existence:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const exists = !!player;
    console.log(`Wallet player existence check for address ${walletAddress}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    return NextResponse.json({
      exists,
      player: exists ? {
        id: player.id,
        user_id: player.user_id,
        display_name: player.display_name,
        wallet_address: player.wallet_address,
        farcaster_fid: player.farcaster_fid
      } : null
    });

  } catch (error) {
    console.error('Wallet player existence check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
