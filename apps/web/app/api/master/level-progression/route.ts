import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { apiRateLimiter, getClientIdentifier } from '../../../../lib/rateLimiter';
import { requireAdmin } from '../../../../lib/adminAuth';
import { createServerSupabaseClient } from '../../../../lib/supabase';

// Authentication helper function
async function authenticateUser(request: NextRequest) {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore cookie setting errors
          }
        },
      },
    }
  );

  // Try to get user from session first
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  
  if (user) {
    return { userId: user.id, authMethod: 'session' };
  }

  // Check for Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Verify Supabase token
    try {
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      if (user && !error) {
        return { userId: user.id, authMethod: 'bearer' };
      }
    } catch (e) {
      console.error('Error verifying token:', e);
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = apiRateLimiter.isAllowed(clientId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get('session_type');
    const durationMinutes = searchParams.get('duration_minutes');

    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('level_progression_master')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true });

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    if (durationMinutes) {
      query = query.eq('duration_minutes', parseInt(durationMinutes));
    }

    const { data: progression, error } = await query;

    if (error) {
      console.error('Error fetching level progression:', error);
      return NextResponse.json(
        { error: 'Failed to fetch level progression' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: progression,
    });

    // Add caching headers to reduce Edge Requests
    response.headers.set('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // 30 minutes
    response.headers.set('ETag', `"level-progression-${Date.now()}"`);

    return response;

  } catch (error) {
    console.error('Level progression API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for admin updates (requires admin authentication)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin privileges
    const adminCheck = await requireAdmin(auth.userId);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { level, xp_to_next, cumulative_xp, description, rewards, is_active } = body;

    // Validate required fields
    if (!level || xp_to_next === undefined || cumulative_xp === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: level, xp_to_next, cumulative_xp' },
        { status: 400 }
      );
    }

    // Update or insert level progression
    const { data, error } = await supabase
      .from('level_progression_master')
      .upsert({
        level,
        xp_to_next,
        cumulative_xp,
        description,
        rewards,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating level progression:', error);
      return NextResponse.json(
        { error: 'Failed to update level progression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Level progression update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
