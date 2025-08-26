import { NextRequest, NextResponse } from 'next/server';
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";

// In-memory storage for notification tokens (replace with database in production)
const notificationTokens = new Map<string, { token: string; url: string; fid: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse and verify the webhook event
    const data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
    
    console.log('📨 Received webhook event:', data.event);
    
    // Handle different event types
    switch (data.event) {
      case 'miniapp_added':
        if (data.notificationDetails) {
          const key = `${data.fid}-${data.clientApp}`;
          notificationTokens.set(key, {
            token: data.notificationDetails.token,
            url: data.notificationDetails.url,
            fid: data.fid,
          });
          console.log('✅ Mini App added with notifications enabled for FID:', data.fid);
        } else {
          console.log('✅ Mini App added without notifications for FID:', data.fid);
        }
        break;
        
      case 'miniapp_removed':
        // Remove all tokens for this user
        for (const [key, value] of notificationTokens.entries()) {
          if (value.fid === data.fid) {
            notificationTokens.delete(key);
          }
        }
        console.log('❌ Mini App removed for FID:', data.fid);
        break;
        
      case 'notifications_disabled':
        // Remove tokens for this user
        for (const [key, value] of notificationTokens.entries()) {
          if (value.fid === data.fid) {
            notificationTokens.delete(key);
          }
        }
        console.log('🔕 Notifications disabled for FID:', data.fid);
        break;
        
      case 'notifications_enabled':
        if (data.notificationDetails) {
          const key = `${data.fid}-${data.clientApp}`;
          notificationTokens.set(key, {
            token: data.notificationDetails.token,
            url: data.notificationDetails.url,
            fid: data.fid,
          });
          console.log('🔔 Notifications enabled for FID:', data.fid);
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

// Helper function to get notification tokens for a user
export function getNotificationTokens(fid: string): { token: string; url: string }[] {
  const tokens: { token: string; url: string }[] = [];
  
  for (const [key, value] of notificationTokens.entries()) {
    if (value.fid === fid) {
      tokens.push({
        token: value.token,
        url: value.url,
      });
    }
  }
  
  return tokens;
}

// Helper function to send notifications
export async function sendNotification(
  notificationId: string,
  title: string,
  body: string,
  targetUrl: string,
  tokens: string[]
): Promise<{
  successfulTokens: string[];
  invalidTokens: string[];
  rateLimitedTokens: string[];
}> {
  if (tokens.length === 0) {
    return {
      successfulTokens: [],
      invalidTokens: [],
      rateLimitedTokens: [],
    };
  }
  
  // Group tokens by URL (different clients may have different URLs)
  const tokensByUrl = new Map<string, string[]>();
  
  for (const token of tokens) {
    // In a real implementation, you'd look up the URL for each token
    // For now, we'll use a default URL
    const url = 'https://api.farcaster.xyz/v1/frame-notifications';
    
    if (!tokensByUrl.has(url)) {
      tokensByUrl.set(url, []);
    }
    tokensByUrl.get(url)!.push(token);
  }
  
  const successfulTokens: string[] = [];
  const invalidTokens: string[] = [];
  const rateLimitedTokens: string[] = [];
  
  // Send notifications to each URL
  for (const [url, urlTokens] of tokensByUrl.entries()) {
    try {
      // Batch tokens (max 100 per request)
      const batches = [];
      for (let i = 0; i < urlTokens.length; i += 100) {
        batches.push(urlTokens.slice(i, i + 100));
      }
      
      for (const batch of batches) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
            title,
            body,
            targetUrl,
            tokens: batch,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          successfulTokens.push(...result.successfulTokens);
          invalidTokens.push(...result.invalidTokens);
          rateLimitedTokens.push(...result.rateLimitedTokens);
        } else {
          console.error('Failed to send notification batch:', response.status);
          // Assume all tokens in this batch failed
          invalidTokens.push(...batch);
        }
      }
    } catch (error) {
      console.error('Error sending notifications to URL:', url, error);
      // Assume all tokens for this URL failed
      invalidTokens.push(...urlTokens);
    }
  }
  
  return {
    successfulTokens,
    invalidTokens,
    rateLimitedTokens,
  };
}
