import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('players')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to connect to Supabase',
          error: error.message 
        },
        { status: 500 }
      );
    }

    // Test if we can access the players table
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, display_name, wallet_address, level, xp, coins, sparks')
      .limit(5);

    if (playersError) {
      console.error('Players table access error:', playersError);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Failed to access players table',
          error: playersError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      playersCount: players?.length || 0,
      samplePlayers: players || [],
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    });

  } catch (error) {
    console.error('Test Supabase error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
