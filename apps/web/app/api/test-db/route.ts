import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Test if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Environment variables not set',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }, { status: 500 });
    }

    // Test database connection
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Test session_rewards_master access
    const { data: rewards, error } = await supabase
      .from('session_rewards_master')
      .select('*')
      .eq('session_type', 'Train')
      .eq('duration_minutes', 5)
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: 'Database query failed',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      },
      database: {
        rewards: rewards,
        count: rewards?.length || 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
