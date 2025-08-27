import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Use service role client for database operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // First, verify the alpha code
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_alpha_code', {
      p_code: code
    });

    if (verifyError) {
      console.error('Alpha code verification RPC error:', verifyError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!verifyData || verifyData.length === 0 || !verifyData[0].is_valid) {
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Generate a reservation token
    const reservedToken = `reserved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Reserve the alpha code
    const { data: reserveData, error: reserveError } = await supabase.rpc('reserve_alpha_code', {
      p_code: code,
      p_reservation_token: reservedToken,
      p_reservation_duration_minutes: 5
    });

    if (reserveError) {
      console.error('Alpha code reservation RPC error:', reserveError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!reserveData || reserveData.length === 0 || !reserveData[0].success) {
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    const reservedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now

    return NextResponse.json({
      reserved_token: reservedToken,
      reserved_until: reservedUntil
    });

  } catch (error) {
    console.error('Alpha code verification error:', error);
    return NextResponse.json(
      { error: 'alpha code invalid' },
      { status: 500 }
    );
  }
}
