import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.raw_user_meta_data?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all subscriptions with user info
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        players!inner(
          display_name,
          wallet_address
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.raw_user_meta_data?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      user_id,
      subscription_type,
      status = 'active',
      provider = 'admin',
      external_id = null,
      expires_at = null,
      auto_tag_enabled = true
    } = body;

    // Validate required fields
    if (!user_id || !subscription_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, subscription_type' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if subscription already exists for this user and type
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('subscription_type', subscription_type)
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription already exists for this user and type' },
        { status: 409 }
      );
    }

    // Create new subscription
    const { data: newSubscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id,
        subscription_type,
        status,
        provider,
        external_id,
        expires_at,
        auto_tag_enabled
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newSubscription
    });

  } catch (error) {
    console.error('Admin subscriptions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.raw_user_meta_data?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      id,
      status,
      provider,
      external_id,
      expires_at,
      auto_tag_enabled
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Update subscription
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (provider !== undefined) updateData.provider = provider;
    if (external_id !== undefined) updateData.external_id = external_id;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (auto_tag_enabled !== undefined) updateData.auto_tag_enabled = auto_tag_enabled;

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Admin subscriptions PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
