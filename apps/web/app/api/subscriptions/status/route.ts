import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get auth token for the request
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      // Check if this is a wallet user
      if (authHeader.startsWith('wallet:')) {
        try {
          const walletData = JSON.parse(authHeader.substring(7)); // Remove 'wallet:'
          userId = walletData.id;
        } catch (e) {
          console.error('Error parsing wallet user from header:', e);
        }
      }
      
      // Check if this is a Base App user
      if (!userId && authHeader.startsWith('baseapp:')) {
        try {
          const baseAppData = JSON.parse(authHeader.substring(8)); // Remove 'baseapp:'
          userId = `baseapp-${baseAppData.id}`;
        } catch (e) {
          console.error('Error parsing Base App user from header:', e);
        }
      }
      
      // If it's a Supabase access token, verify it
      if (!userId && !authHeader.startsWith('wallet:') && !authHeader.startsWith('baseapp:')) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          // Handle both direct token and Bearer token formats
          let token = authHeader;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
          }
          
          const { data: { user }, error: tokenError } = await supabaseAuth.auth.getUser(token);
          if (user && !tokenError) {
            userId = user.id;
          } else {
            console.error('Token verification failed:', tokenError);
          }
        } catch (e) {
          console.error('Error verifying token:', e);
        }
      }
    }
    
    // Fallback: Check if this is a wallet user by looking for wallet address in cookies
    if (!userId) {
      const cookieStore = await cookies();
      const walletUser = cookieStore.get('wallet-user');
      if (walletUser) {
        try {
          const walletData = JSON.parse(walletUser.value);
          userId = walletData.id;
        } catch (e) {
          console.error('Error parsing wallet user data:', e);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription status' },
        { status: 500 }
      );
    }

    // Calculate total remaining time and subscription info
    const now = new Date();
    let totalRemainingDays = 0;
    let totalRemainingHours = 0;
    let totalRemainingMinutes = 0;
    let hasActiveSubscription = false;
    let subscriptionDetails: any[] = [];

    if (subscriptions && subscriptions.length > 0) {
      hasActiveSubscription = true;
      
      // For stacked subscriptions, we only care about the latest expiry date
      // Find the subscription with the latest expiry date
      const latestSubscription = subscriptions.reduce((latest, sub) => {
        if (sub.expires_at) {
          const expiryDate = new Date(sub.expires_at);
          if (!latest.expires_at || expiryDate > new Date(latest.expires_at)) {
            return sub;
          }
        }
        return latest;
      }, subscriptions[0]);
      
      // Calculate remaining time from the latest expiry date only
      if (latestSubscription.expires_at) {
        const expiryDate = new Date(latestSubscription.expires_at);
        const timeRemaining = expiryDate.getTime() - now.getTime();
        
        if (timeRemaining > 0) {
          totalRemainingDays = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          totalRemainingHours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          totalRemainingMinutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        }
      }
      
      // Log the stacking calculation for debugging
      console.log('Subscription stacking calculation:', {
        totalSubscriptions: subscriptions.length,
        latestExpiryDate: latestSubscription.expires_at,
        totalRemainingDays,
        totalRemainingHours,
        totalRemainingMinutes,
        subscriptionDetails: subscriptions.map(sub => ({
          type: sub.subscription_type,
          expires_at: sub.expires_at,
          started_at: sub.started_at
        }))
      });
      
      // Collect all subscription details for display
      subscriptions.forEach(sub => {
        subscriptionDetails.push({
          type: sub.subscription_type,
          expires_at: sub.expires_at,
          started_at: sub.started_at,
          provider: sub.provider
        });
      });
    }

    // Get player's inspired status
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('is_inspired')
      .eq('user_id', userId)
      .single();

    if (playerError) {
      console.error('Error fetching player status:', playerError);
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription,
        isInspired: player?.is_inspired || false,
        totalRemainingDays,
        totalRemainingHours,
        totalRemainingMinutes,
        subscriptionDetails,
        subscriptions: subscriptions || []
      }
    });

  } catch (error) {
    console.error('Subscription status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
