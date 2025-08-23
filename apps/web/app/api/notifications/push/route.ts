import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get VAPID keys
function getVapidKeys() {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };
}

// Configure VAPID details
function configureVapid() {
  const vapidKeys = getVapidKeys();
  if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
      'mailto:notifications@dtd.rchetype.xyz',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    return true;
  }
  return false;
}

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  priority?: 'very-low' | 'low' | 'normal' | 'high';
  ttl?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Configure VAPID if keys are available
    const vapidConfigured = configureVapid();
    
    const requestBody: PushNotificationRequest = await request.json();
    const { userId, title, body, icon, badge, tag, data, actions, requireInteraction, silent, vibrate, priority, ttl } = requestBody;

    // Validate required fields
    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Check if VAPID is configured
    if (!vapidConfigured) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error fetching push subscriptions:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch push subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No push subscriptions found for user' },
        { status: 200 }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon.png',
      badge: badge || '/icon.png',
      tag: tag || 'default',
      data: {
        ...data,
        timestamp: Date.now(),
        userId
      },
      actions: actions || [],
      requireInteraction: requireInteraction || false,
      silent: silent || false,
      vibrate: vibrate || [200, 100, 200]
    });

    // Send notifications to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          const options = {
            TTL: ttl || 86400, // 24 hours default
            urgency: priority || 'normal',
            topic: tag || 'default'
          };

          const result = await webpush.sendNotification(
            pushSubscription,
            payload,
            options
          );

          return {
            success: true,
            subscriptionId: subscription.id,
            statusCode: result.statusCode,
            headers: result.headers
          };
        } catch (error: any) {
          console.error('Push notification failed:', error);
          
          // If subscription is invalid, remove it
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }

          return {
            success: false,
            subscriptionId: subscription.id,
            error: error.message,
            statusCode: error.statusCode
          };
        }
      })
    );

    // Count successful and failed sends
    const successfulSends = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedSends = results.length - successfulSends;

    // Log notification to database
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        type: 'push_notification',
        title,
        body,
        data: { ...data, actions, priority, ttl },
        sent_count: successfulSends,
        total_count: results.length,
        sent_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      sent: successfulSends,
      failed: failedSends,
      total: results.length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    });

  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to test VAPID configuration
export async function GET() {
  try {
    const vapidKeys = getVapidKeys();
    
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vapidConfigured: true,
      publicKey: vapidKeys.publicKey
    });
  } catch (error) {
    console.error('VAPID test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
