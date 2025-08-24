import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Check for wallet user in cookie
    const walletUser = cookieStore.get('wallet-user');
    let userId: string | null = null;
    
    if (walletUser) {
      try {
        const walletData = JSON.parse(walletUser.value);
        userId = walletData.id;
        console.log('Test: Found wallet user in cookie:', userId);
      } catch (e) {
        console.error('Test: Error parsing wallet user data:', e);
      }
    }
    
    // Check for wallet user in header
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer wallet:')) {
        try {
          const walletData = JSON.parse(authHeader.substring(15));
          userId = walletData.id;
          console.log('Test: Found wallet user in header:', userId);
        } catch (e) {
          console.error('Test: Error parsing wallet user from header:', e);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No wallet user found' },
        { status: 401 }
      );
    }
    
    // Test database access
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (playerError) {
      console.error('Test: Player query error:', playerError);
      return NextResponse.json(
        { error: 'Database access failed', details: playerError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      userId,
      player,
      message: 'Wallet authentication working correctly'
    });
    
  } catch (error) {
    console.error('Test: Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}
