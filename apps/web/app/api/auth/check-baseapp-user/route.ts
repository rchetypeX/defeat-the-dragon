import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Check if a player exists with this Farcaster FID
    const { data: player, error } = await supabase
      .from('players')
      .select('id, user_id, display_name, farcaster_fid')
      .eq('farcaster_fid', fid)
      .maybeSingle();

    if (error) {
      console.error('Error checking Base App user existence:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const exists = !!player;
    console.log(`Base App user existence check for FID ${fid}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    return NextResponse.json({
      exists,
      player: exists ? {
        id: player.id,
        user_id: player.user_id,
        display_name: player.display_name,
        farcaster_fid: player.farcaster_fid
      } : null
    });

  } catch (error) {
    console.error('Base App user existence check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
