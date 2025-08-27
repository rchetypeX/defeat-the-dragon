import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { StartSessionRequest, StartSessionResponse } from '@defeat-the-dragon/engine';
import { actionForMinutes } from '@defeat-the-dragon/engine';

// Initialize Supabase client for server-side operations (service role for bypassing RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Extract the token
    const token = authHeader.substring(7);
    console.log('API: Token extracted, length:', token.length);
    
    let userId: string | null = null;
    let isWalletUser = false;
    
    // Check if this is a wallet user token
    if (token.startsWith('wallet:')) {
      try {
        const walletData = JSON.parse(token.substring(7)); // Remove 'wallet:'
        userId = walletData.id;
        isWalletUser = true;
        console.log('API: Wallet user detected, user ID:', userId);
      } catch (e) {
        console.error('API: Error parsing wallet token:', e);
        return NextResponse.json(
          { error: 'Invalid wallet token format' },
          { status: 401 }
        );
      }
    } else if (token === 'mock-token-for-development') {
      console.log('API: Using mock token, skipping Supabase auth');
      userId = 'mock-user-id';
    } else {
      // Standard Supabase JWT token
      console.log('API: Standard JWT token detected');
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          console.error('API: JWT token validation failed:', error);
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          );
        }
        userId = user.id;
        console.log('API: JWT user validated, user ID:', userId);
      } catch (e) {
        console.error('API: Error validating JWT token:', e);
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
    }
    
    if (!userId) {
      console.log('API: No user ID found');
      return NextResponse.json(
        { error: 'Unable to determine user identity' },
        { status: 401 }
      );
    }

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
    
    if (userId === 'mock-user-id') {
      // Create mock session data
      session = {
        id: crypto.randomUUID(),
        user_id: 'mock-user-id',
        action,
        started_at: startedAt.toISOString(),
        // disturbed_seconds, dungeon_floor, boss_tier removed as part of database cleanup
      };
      sessionError = null;
      console.log('API: Created mock session');
    } else {
      // Create real session in database using service role client
      const { data: dbSession, error: dbError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          action,
          started_at: startedAt.toISOString(),
                  // disturbed_seconds, dungeon_floor, boss_tier removed as part of database cleanup
        })
        .select()
        .single();
      
      session = dbSession;
      sessionError = dbError;
      console.log('API: Database session creation result:', { hasSession: !!session, hasError: !!sessionError });
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
