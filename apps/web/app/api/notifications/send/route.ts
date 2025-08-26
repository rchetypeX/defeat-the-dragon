import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../../lib/notificationService';

export async function POST(request: NextRequest) {
  try {
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
