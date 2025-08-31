import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get user session from Supabase
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Use service role client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try to get user from session first
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    let userId: string | null = null;
    let authMethod: string = 'none';
    
    if (user) {
      // Standard Supabase auth user
      userId = user.id;
      authMethod = 'supabase_session';
      console.log('User authenticated via Supabase session:', userId);
    } else {
      // Check for Bearer token in Authorization header (like other APIs)
      const authHeader = request.headers.get('authorization');
      console.log('Auth header received:', authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer '
        
        // Check if this is a wallet user
        if (token.startsWith('wallet:')) {
          try {
            const walletData = JSON.parse(token.substring(7)); // Remove 'wallet:'
            userId = walletData.id;
            authMethod = 'wallet_header';
            console.log('User authenticated via wallet header:', userId);
          } catch (e) {
            console.error('Error parsing wallet user from header:', e);
          }
        }
        
        // Check if this is a Base App user
        if (!userId && token.startsWith('baseapp:')) {
          try {
            const baseAppData = JSON.parse(token.substring(8)); // Remove 'baseapp:'
            // Convert Base App numeric ID to a consistent UUID format
            userId = `baseapp-${baseAppData.id}`;
            authMethod = 'baseapp_header';
            console.log('User authenticated via Base App header:', userId);
          } catch (e) {
            console.error('Error parsing Base App user from header:', e);
          }
        }
        
        // If it's a Supabase access token, verify it
        if (!userId && !token.startsWith('wallet:') && !token.startsWith('baseapp:')) {
          try {
            // Verify the token with Supabase
            const { data: { user: tokenUser }, error: tokenError } = await supabaseAuth.auth.getUser(token);
            if (tokenUser && !tokenError) {
              userId = tokenUser.id;
              authMethod = 'bearer_token';
              console.log('User authenticated via Bearer token:', userId);
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
        const walletUser = cookieStore.get('wallet-user');
        if (walletUser) {
          try {
            const walletData = JSON.parse(walletUser.value);
            userId = walletData.id;
            authMethod = 'wallet_cookie';
            console.log('User authenticated via wallet cookie:', userId);
          } catch (e) {
            console.error('Error parsing wallet user data:', e);
          }
        }
      }
    }
    
    console.log('Subscription creation auth result:', { userId, authMethod, authError });
    
    if (!userId) {
      console.error('Subscription creation failed - no valid user ID found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Subscription creation request body:', body);
    
    const { subscriptionType, duration, transactionHash } = body;

    // Enhanced validation with detailed error messages
    if (!subscriptionType) {
      console.error('Missing subscriptionType in request body');
      return NextResponse.json(
        { error: 'Missing required field: subscriptionType' },
        { status: 400 }
      );
    }
    
    if (!duration) {
      console.error('Missing duration in request body');
      return NextResponse.json(
        { error: 'Missing required field: duration' },
        { status: 400 }
      );
    }
    
    if (!transactionHash) {
      console.error('Missing transactionHash in request body');
      return NextResponse.json(
        { error: 'Missing required field: transactionHash' },
        { status: 400 }
      );
    }

    console.log('Subscription creation validation passed:', { subscriptionType, duration, transactionHash });

    // Check for existing active subscriptions to calculate stacked duration
    const { data: existingSubscriptions, error: existingError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    if (existingError) {
      console.error('Error checking existing subscriptions:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing subscriptions', details: existingError.message },
        { status: 500 }
      );
    }

    // Calculate total stacked duration
    let totalDuration = duration;
    let baseExpiryDate = new Date();
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Find the latest expiry date from existing subscriptions
      const latestExpiry = existingSubscriptions.reduce((latest, sub) => {
        if (sub.expires_at) {
          const expiryDate = new Date(sub.expires_at);
          return expiryDate > latest ? expiryDate : latest;
        }
        return latest;
      }, new Date(0));
      
      if (latestExpiry > new Date(0)) {
        baseExpiryDate = latestExpiry;
        console.log('Stacking subscription on existing expiry date:', baseExpiryDate);
      }
      
      // Log all existing subscriptions for debugging
      console.log('Existing subscriptions for stacking calculation:', existingSubscriptions.map(sub => ({
        id: sub.id,
        type: sub.subscription_type,
        started_at: sub.started_at,
        expires_at: sub.expires_at,
        duration_days: sub.expires_at ? Math.ceil((new Date(sub.expires_at).getTime() - new Date(sub.started_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      })));
    }

    // Calculate new expiration date by adding duration to the base date
    const expiresAt = new Date(baseExpiryDate);
    expiresAt.setDate(expiresAt.getDate() + duration);
    
    console.log('Subscription stacking calculation:', {
      existingSubscriptionsCount: existingSubscriptions?.length || 0,
      baseExpiryDate: baseExpiryDate.toISOString(),
      newDuration: duration,
      calculatedExpiryDate: expiresAt.toISOString(),
      totalDaysFromBase: Math.ceil((expiresAt.getTime() - baseExpiryDate.getTime()) / (1000 * 60 * 60 * 24))
    });

    // Create new subscription record (don't overwrite existing ones)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_type: subscriptionType,
        status: 'active',
        provider: 'usdc',
        external_id: transactionHash,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: subscriptionError.message },
        { status: 500 }
      );
    }

    // Update user's "Inspired" status in players table to unlock Sparks rewards
    const { error: playerError } = await supabase
      .from('players')
      .update({
        is_inspired: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (playerError) {
      console.error('Error updating player inspired status:', playerError);
      return NextResponse.json(
        { error: 'Failed to update player status', details: playerError.message },
        { status: 500 }
      );
    }

    // Log the subscription creation
    console.log(`Subscription created for user ${userId}:`, {
      subscriptionType,
      duration,
      transactionHash,
      expiresAt,
      authMethod
    });

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        expiresAt: expiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}
