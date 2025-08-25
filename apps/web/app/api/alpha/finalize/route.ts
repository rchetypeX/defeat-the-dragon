import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reserved_token } = await request.json();
    
    if (!reserved_token || typeof reserved_token !== 'string') {
      return NextResponse.json(
        { error: 'alpha code invalid' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'must be signed in' },
        { status: 401 }
      );
    }

    // Finalize the alpha code
    const { data, error } = await supabase.rpc('alpha_finalize_with_token', {
      p_token: reserved_token
    });

    if (error) {
      console.error('Alpha code finalization error:', error);
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Alpha code finalization error:', error);
    return NextResponse.json(
      { error: 'alpha code invalid' },
      { status: 500 }
    );
  }
}
