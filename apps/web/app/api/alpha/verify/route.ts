import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get client IP and user agent for attempt logging
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limiting: Check recent attempts from this IP
    const { data: recentAttempts } = await supabase
      .from('alpha_code_attempts')
      .select('created_at')
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .limit(10);

    if (recentAttempts && recentAttempts.length >= 5) {
      // Log the attempt
      await supabase.from('alpha_code_attempts').insert({
        ip_address: ip,
        user_agent: userAgent,
        success: false
      });

      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 429 }
      );
    }

    // Verify and reserve the code
    const { data, error } = await supabase.rpc('alpha_verify_and_reserve', {
      p_code: code
    });

    if (error) {
      // Log failed attempt
      await supabase.from('alpha_code_attempts').insert({
        ip_address: ip,
        user_agent: userAgent,
        success: false
      });

      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      // Log failed attempt
      await supabase.from('alpha_code_attempts').insert({
        ip_address: ip,
        user_agent: userAgent,
        success: false
      });

      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Log successful attempt
    await supabase.from('alpha_code_attempts').insert({
      ip_address: ip,
      user_agent: userAgent,
      success: true
    });

    const { reserved_token, reserved_until } = data[0];

    return NextResponse.json({
      reserved_token,
      reserved_until
    });

  } catch (error) {
    console.error('Alpha code verification error:', error);
    return NextResponse.json(
      { error: 'alpha code invalid' },
      { status: 500 }
    );
  }
}
