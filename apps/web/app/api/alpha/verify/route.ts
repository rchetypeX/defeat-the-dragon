import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== ALPHA CODE VERIFICATION START ===');
  
  try {
    const body = await request.json();
    const { code } = body;
    
    console.log('Received code:', code);
    
    if (!code || typeof code !== 'string') {
      console.log('Invalid code format');
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Use service role client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Clean and normalize the code
    const cleanCode = code.trim().toUpperCase();
    console.log('Cleaned code:', cleanCode);
    
    // Simple: Look for the exact code in the database
    const { data: alphaCode, error: fetchError } = await supabase
      .from('alpha_codes')
      .select('*')
      .eq('code_hash', cleanCode)
      .eq('used', false)
      .single();
    
    console.log('Database query result:', { alphaCode, fetchError });

    if (fetchError) {
      console.error('Alpha code fetch error:', fetchError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!alphaCode) {
      console.error('Alpha code not found or already used:', cleanCode);
      
      // Debug: Show what codes exist
      const { data: allCodes } = await supabase
        .from('alpha_codes')
        .select('code_hash, used')
        .limit(5);
      
      console.log('Available codes in database:', allCodes);
      
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    // Check if code is already reserved
    if (alphaCode.reserved_token && alphaCode.reserved_until && new Date(alphaCode.reserved_until) > new Date()) {
      console.error('Alpha code is already reserved:', cleanCode);
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

    console.log('✅ Alpha code verified and reserved successfully');
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
