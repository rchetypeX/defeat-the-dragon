import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid auth token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Reset character size to 'small' (new default)
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        character_size: 'small',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error resetting character size:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset character size' },
        { status: 500 }
      );
    }

    console.log(`✅ Character size reset to small for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Character size reset to new default size',
      character_size: 'small'
    });

  } catch (error) {
    console.error('Error in reset-character-size endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
