import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../../lib/notificationService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    const body = await request.json();
    const { type, fid, data } = body;

    if (!type || !fid) {
      return NextResponse.json(
        { error: 'Missing required fields: type, fid' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'focus_reminder':
        result = await notificationService.sendFocusReminder(fid, data?.sessionType);
        break;
        
      case 'achievement':
        if (!data?.achievement) {
          return NextResponse.json(
            { error: 'Missing achievement data' },
            { status: 400 }
          );
        }
        result = await notificationService.sendAchievementNotification(fid, data.achievement);
        break;
        
      case 'level_up':
        if (!data?.level || !data?.character) {
          return NextResponse.json(
            { error: 'Missing level or character data' },
            { status: 400 }
          );
        }
        result = await notificationService.sendLevelUpNotification(fid, data.level, data.character);
        break;
        
      case 'daily_challenge':
        if (!data?.challenge) {
          return NextResponse.json(
            { error: 'Missing challenge data' },
            { status: 400 }
          );
        }
        result = await notificationService.sendDailyChallenge(fid, data.challenge);
        break;
        
      case 'streak_milestone':
        if (!data?.streakDays) {
          return NextResponse.json(
            { error: 'Missing streak days data' },
            { status: 400 }
          );
        }
        result = await notificationService.sendStreakMilestone(fid, data.streakDays);
        break;
        
      case 'custom':
        if (!data?.notificationId || !data?.title || !data?.body || !data?.targetUrl) {
          return NextResponse.json(
            { error: 'Missing custom notification data' },
            { status: 400 }
          );
        }
        result = await notificationService.sendToUser({
          notificationId: data.notificationId,
          title: data.title,
          body: data.body,
          targetUrl: data.targetUrl,
          fid,
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check notification status
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd check the database
    // For now, we'll return a mock response
    return NextResponse.json({
      hasNotifications: true,
      lastNotification: new Date().toISOString(),
      notificationCount: 0,
    });

  } catch (error) {
    console.error('Error checking notification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
