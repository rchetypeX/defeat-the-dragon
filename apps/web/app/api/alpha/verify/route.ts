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
    
    // Normalize the code (remove spaces, convert to uppercase)
    const normalizedCode = code.replace(/[\s-]/g, '').toUpperCase();
    
    // First, check if the alpha code exists and is available
    const { data: alphaCode, error: fetchError } = await supabase
      .from('alpha_codes')
      .select('*')
      .eq('code_hash', normalizedCode)
      .eq('used', false)
      .single();

    if (fetchError) {
      console.error('Alpha code fetch error:', fetchError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!alphaCode) {
      console.error('Alpha code not found or already used:', normalizedCode);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Check if code is already reserved
    if (alphaCode.reserved_token && alphaCode.reserved_until && new Date(alphaCode.reserved_until) > new Date()) {
      console.error('Alpha code is already reserved:', normalizedCode);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Generate a reservation token
    const reservedToken = `reserved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reservedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
    
    // Reserve the alpha code
    const { error: reserveError } = await supabase
      .from('alpha_codes')
      .update({
        reserved_token: reservedToken,
        reserved_until: reservedUntil
      })
      .eq('id', alphaCode.id)
      .eq('used', false);

    if (reserveError) {
      console.error('Alpha code reservation error:', reserveError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

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
