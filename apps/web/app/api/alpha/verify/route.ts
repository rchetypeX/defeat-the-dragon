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
    
    // Verify the alpha code
    const { data, error } = await supabase.rpc('verify_alpha_code', {
      p_code: code
    });

    if (error) {
      console.error('Alpha code verification RPC error:', error);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alpha code verified successfully'
    });

  } catch (error) {
    console.error('Alpha code verification error:', error);
    return NextResponse.json(
      { error: 'alpha code invalid' },
      { status: 500 }
    );
  }
}
