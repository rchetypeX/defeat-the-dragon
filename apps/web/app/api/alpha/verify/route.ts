import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ALPHA CODE VERIFICATION START ===');
    const { code } = await request.json();
    
    console.log('Received code:', code);
    
    if (!code || typeof code !== 'string') {
      console.log('Invalid code format');
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
    
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // First, let's check if the alpha_codes table has any data
    const { data: tableCheck, error: tableError } = await supabase
      .from('alpha_codes')
      .select('count')
      .limit(1);
    
    console.log('Table check result:', { tableCheck, tableError });
    
    // Get all codes for debugging
    const { data: allCodes, error: allError } = await supabase
      .from('alpha_codes')
      .select('code_hash, used')
      .limit(5);
    
    console.log('All codes in database:', allCodes);
    console.log('All codes error:', allError);
    
    // Normalize the code (remove spaces, convert to uppercase)
    const normalizedCode = code.replace(/[\s-]/g, '').toUpperCase();
    console.log('Alpha code verification attempt:', { originalCode: code, normalizedCode });
    
    // Try to find the alpha code - it could be stored as plain text or hashed
    let alphaCode = null;
    let fetchError = null;
    
    // First try: Look for plain text code (DTD-XXXX-XXXX format)
    const { data: plainTextCode, error: plainTextError } = await supabase
      .from('alpha_codes')
      .select('*')
      .eq('code_hash', code.toUpperCase()) // Try exact match first
      .eq('used', false)
      .single();
    
    if (plainTextCode) {
      alphaCode = plainTextCode;
      console.log('Found alpha code as plain text');
    } else {
      // Second try: Look for normalized code (DTDXXXX-XXXX format)
      const { data: normalizedCodeResult, error: normalizedError } = await supabase
        .from('alpha_codes')
        .select('*')
        .eq('code_hash', normalizedCode)
        .eq('used', false)
        .single();
      
      if (normalizedCodeResult) {
        alphaCode = normalizedCodeResult;
        console.log('Found alpha code as normalized text');
      } else {
        fetchError = normalizedError;
        console.log('Alpha code not found in either format');
      }
    }

    console.log('Database query result:', { alphaCode, fetchError });

    if (fetchError) {
      console.error('Alpha code fetch error:', fetchError);
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    if (!alphaCode) {
      console.error('Alpha code not found or already used:', normalizedCode);
      
      // Let's also check what codes exist in the database for debugging
      const { data: allCodes, error: debugError } = await supabase
        .from('alpha_codes')
        .select('code_hash, used')
        .limit(10);
      
      console.log('Debug: First 10 codes in database:', allCodes);
      console.log('Debug: Looking for code:', code.toUpperCase());
      console.log('Debug: Looking for normalized code:', normalizedCode);
      
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
