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
  console.log('API: POST /sessions/start called');
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('API: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('API: Invalid auth header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the JWT token
    const token = authHeader.substring(7);
    console.log('API: Token extracted, length:', token.length);
    
    // Check if this is a mock token for development
    if (token === 'mock-token-for-development') {
      console.log('API: Using mock token, skipping Supabase auth');
      // Continue with mock user data
    } else {
      // We'll verify the user later when creating the session
      console.log('API: Will verify user token when creating session');
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

    // Parse and validate the request body
    console.log('API: Parsing request body...');
    const body = await request.json();
    console.log('API: Request body:', body);
    
    console.log('API: Validating request...');
    const validationResult = StartSessionRequest.safeParse(body);
    console.log('API: Validation result:', { success: validationResult.success });
    
    if (!validationResult.success) {
      console.log('API: Validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }

    const { action, duration_minutes } = validationResult.data;
    console.log('API: Validated data:', { action, duration_minutes });

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

    // Create the session in the database
    console.log('API: Creating session in database...');
    
    let session;
    let sessionError;
    let user = null;
    
    if (token === 'mock-token-for-development') {
      // Create mock session data
      session = {
        id: crypto.randomUUID(),
        user_id: 'mock-user-id',
        action,
        started_at: startedAt.toISOString(),
        disturbed_seconds: 0,
        dungeon_floor: 0,
        boss_tier: 'none'
      };
      sessionError = null;
      console.log('API: Created mock session');
    } else {
      // Get user info first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      user = authUser;

      // Create real session in database
      const { data: dbSession, error: dbError } = await authenticatedSupabase
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
      
      session = dbSession;
      sessionError = dbError;
    }

    console.log('API: Database result:', { hasSession: !!session, hasError: !!sessionError });

    if (sessionError) {
      console.error('Database error creating session:', sessionError);
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      );
    }

    // Prepare the response
    console.log('API: Preparing response...');
    const response: z.infer<typeof StartSessionResponse> = {
      session_id: session.id,
      expected_end_time: expectedEndTime.toISOString(),
      nonce
    };

    console.log('API: Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
