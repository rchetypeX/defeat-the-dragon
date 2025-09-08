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
    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Use centralized Supabase client to avoid multiple instances
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('shop_items_master')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: shopItems, error } = await query;

    if (error) {
      console.error('Error fetching shop items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shop items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shopItems,
    });

  } catch (error) {
    console.error('Shop items API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Check admin privileges
    const adminCheck = await requireAdmin(auth.userId);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { item_key, name, price, currency, description, image_url, category, sort_order } = body;

    if (!item_key || !name || price === undefined || !currency || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newItem, error } = await supabase
      .from('shop_items_master')
      .insert({
        item_key,
        name,
        price,
        currency,
        description,
        image_url,
        category,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shop item:', error);
      return NextResponse.json(
        { error: 'Failed to create shop item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newItem,
    });

  } catch (error) {
    console.error('Shop items POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedItem, error } = await supabase
      .from('shop_items_master')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shop item:', error);
      return NextResponse.json(
        { error: 'Failed to update shop item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });

  } catch (error) {
    console.error('Shop items PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
