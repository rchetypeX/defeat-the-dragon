import { NextRequest, NextResponse } from 'next/server';
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import { addNotificationToken, removeNotificationTokens } from '../../../lib/webhookUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse and verify the webhook event
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
    
    console.log('📨 Received webhook event:', data.event);
    
    // Handle different event types
    const eventData = data as any;
    switch (eventData.event) {
      case 'miniapp_added':
        if (eventData.notificationDetails) {
          addNotificationToken(
            eventData.fid,
            eventData.clientApp,
            eventData.notificationDetails.token,
            eventData.notificationDetails.url
          );
          console.log('✅ Mini App added with notifications enabled for FID:', eventData.fid);
        } else {
          console.log('✅ Mini App added without notifications for FID:', eventData.fid);
        }
        break;
        
      case 'miniapp_removed':
        // Remove all tokens for this user
        removeNotificationTokens(eventData.fid);
        console.log('❌ Mini App removed for FID:', eventData.fid);
        break;
        
      case 'notifications_disabled':
        // Remove tokens for this user
        removeNotificationTokens(eventData.fid);
        console.log('🔕 Notifications disabled for FID:', eventData.fid);
        break;
        
      case 'notifications_enabled':
        if (eventData.notificationDetails) {
          addNotificationToken(
            eventData.fid,
            eventData.clientApp,
            eventData.notificationDetails.token,
            eventData.notificationDetails.url
          );
          console.log('🔔 Notifications enabled for FID:', eventData.fid);
        }
        break;
        
      default:
        console.log('⚠️ Unknown event type:', data.event);
    }
    
    // Return 200 OK response
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      const parseError = error as ParseWebhookEvent.ErrorType;
      
      switch (parseError.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          console.error('Invalid webhook data');
          return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
          
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          console.error('Invalid app key');
          return NextResponse.json({ error: 'Invalid app key' }, { status: 401 });
          
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          console.error('App key verification failed');
          return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
          
        default:
          console.error('Unknown webhook error:', parseError);
          return NextResponse.json({ error: 'Internal error' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
