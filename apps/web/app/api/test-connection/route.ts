import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('players')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('Supabase connection successful');
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      playerCount: data || 0,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
