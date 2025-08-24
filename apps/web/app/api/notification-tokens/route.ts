import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, url, userFid } = await request.json();

    // Validate required fields
    if (!token || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: token and url' },
        { status: 400 }
      );
    }

    // Store notification token in database
    const { data, error } = await supabase
      .from('notification_tokens')
      .insert({
        token,
        url,
        user_fid: userFid,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save notification token:', error);
      return NextResponse.json(
        { error: 'Failed to save notification token' },
        { status: 500 }
      );
    }

    console.log('✅ Notification token saved successfully:', {
      token: token.substring(0, 10) + '...',
      url,
      userFid
    });

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    });

  } catch (error) {
    console.error('Notification token API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('userFid');

    if (!userFid) {
      return NextResponse.json(
        { error: 'Missing userFid parameter' },
        { status: 400 }
      );
    }

    // Retrieve notification tokens for user
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_fid', userFid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to retrieve notification tokens:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve notification tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      tokens: data 
    });

  } catch (error) {
    console.error('Notification token retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
