import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationRequest {
  userId: string;
  type: 'session_complete' | 'session_failed' | 'level_up' | 'achievement' | 'streak_milestone' | 'boss_defeated' | 'daily_reminder' | 're_engagement';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, body, data, priority = 'medium' }: NotificationRequest = await request.json();

    if (!userId || !type || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's notification preferences
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('notifications_enabled, notification_preferences')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      );
    }

    // Check if notifications are enabled for this user
    if (!userSettings?.notifications_enabled) {
      return NextResponse.json(
        { success: false, reason: 'Notifications disabled' },
        { status: 200 }
      );
    }

    // Check if this specific notification type is enabled
    const preferences = userSettings.notification_preferences || {};
    const notificationKey = type.replace(/_/g, '') as keyof typeof preferences;
    
    if (preferences[notificationKey] === false) {
      return NextResponse.json(
        { success: false, reason: 'Notification type disabled' },
        { status: 200 }
      );
    }

    // Get user's push subscription
    const { data: pushSubscriptions, error: pushError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (pushError) {
      console.error('Error fetching push subscriptions:', pushError);
      return NextResponse.json(
        { error: 'Failed to fetch push subscriptions' },
        { status: 500 }
      );
    }

    if (!pushSubscriptions || pushSubscriptions.length === 0) {
      return NextResponse.json(
        { success: false, reason: 'No push subscriptions found' },
        { status: 200 }
      );
    }

    // Send push notifications to all user's devices
    const notificationPromises = pushSubscriptions.map(async (subscription) => {
      try {
        // Here you would integrate with a push notification service
        // For now, we'll log the notification
        console.log('📱 Push notification would be sent:', {
          userId,
          type,
          title,
          body,
          data,
          priority,
          endpoint: subscription.endpoint
        });

        // In production, you would use a service like:
        // - Firebase Cloud Messaging (FCM)
        // - OneSignal
        // - Web Push API with VAPID
        // - Base App's notification system

        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, endpoint: subscription.endpoint, error };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successfulSends = results.filter(r => r.success).length;
    const totalSends = results.length;

    // Log notification to database for analytics
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
        priority,
        sent_count: successfulSends,
        total_count: totalSends,
        sent_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      sent: successfulSends,
      total: totalSends,
      results
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get user's notification settings and recent logs
    const [settingsResult, logsResult] = await Promise.all([
      supabase
        .from('user_settings')
        .select('notifications_enabled, notification_preferences')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(10)
    ]);

    if (settingsResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: settingsResult.data,
      recentLogs: logsResult.data || []
    });

  } catch (error) {
    console.error('Error fetching notification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
