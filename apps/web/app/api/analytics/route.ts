import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { event, userFid, url, token, achievement, ...additionalData } = await request.json();

    // Validate required fields
    if (!event) {
      return NextResponse.json(
        { error: 'Missing required field: event' },
        { status: 400 }
      );
    }

    // Store analytics event in database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event,
        user_fid: userFid,
        url,
        token: token ? token.substring(0, 20) + '...' : null, // Truncate for security
        achievement,
        additional_data: additionalData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save analytics event:', error);
      return NextResponse.json(
        { error: 'Failed to save analytics event' },
        { status: 500 }
      );
    }

    console.log('✅ Analytics event saved:', {
      event,
      userFid,
      achievement,
      id: data.id
    });

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    });

  } catch (error) {
    console.error('Analytics API error:', error);
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
    const eventType = searchParams.get('eventType');

    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (userFid) {
      query = query.eq('user_fid', userFid);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to retrieve analytics events:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve analytics events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      events: data 
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
