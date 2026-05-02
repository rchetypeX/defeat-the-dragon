import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { StartSessionRequest, StartSessionResponse } from '@defeat-the-dragon/engine';
import { actionForMinutes } from '@defeat-the-dragon/engine';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the JWT token
    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Create an authenticated client for this request
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const body = await request.json();
    const validationResult = StartSessionRequest.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }

    const { action, duration_minutes } = validationResult.data;

    // Validate that the action matches the duration
    const expectedAction = actionForMinutes(duration_minutes);
    if (action !== expectedAction) {
      return NextResponse.json(
        { error: `Action ${action} does not match duration ${duration_minutes} minutes` },
        { status: 400 }
      );
    }

    // Calculate expected end time
    const startedAt = new Date();
    const expectedEndTime = new Date(startedAt.getTime() + duration_minutes * 60 * 1000);

    // Generate a unique nonce for this session
    const nonce = crypto.randomUUID();

    const { data: session, error: sessionError } = await authenticatedSupabase
      .from('sessions')
      .insert({
        user_id: user.id,
        action,
        started_at: startedAt.toISOString(),
        disturbed_seconds: 0,
        dungeon_floor: 0,
        boss_tier: 'none'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Database error creating session:', sessionError);
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      );
    }

    // Prepare the response
    const response: z.infer<typeof StartSessionResponse> = {
      session_id: session.id,
      expected_end_time: expectedEndTime.toISOString(),
      nonce
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
