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

    // Get all shop items (admin can see all, including inactive)
    const { data: shopItems, error } = await supabase
      .from('shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shop items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shop items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shopItems
    });

  } catch (error) {
    console.error('Admin shop GET error:', error);
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
      sku, 
      name, 
      price, 
      price_sale = 0, 
      type, 
      class_lock = null,
      is_active = true 
    } = body;

    // Validate required fields
    if (!sku || !name || !price || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: sku, name, price, type' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const { data: existingItem } = await supabase
      .from('shop_items')
      .select('id')
      .eq('sku', sku)
      .single();

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item with this SKU already exists' },
        { status: 409 }
      );
    }

    // Create new shop item
    const { data: newItem, error } = await supabase
      .from('shop_items')
      .insert({
        sku,
        name,
        price,
        price_sale,
        type,
        class_lock,
        is_active,
        created_by: user.id
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
      data: newItem
    });

  } catch (error) {
    console.error('Admin shop POST error:', error);
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
      sku, 
      name, 
      price, 
      price_sale, 
      type, 
      class_lock,
      is_active 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Update shop item
    const updateData: any = {};
    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (price_sale !== undefined) updateData.price_sale = price_sale;
    if (type !== undefined) updateData.type = type;
    if (class_lock !== undefined) updateData.class_lock = class_lock;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedItem, error } = await supabase
      .from('shop_items')
      .update(updateData)
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
      data: updatedItem
    });

  } catch (error) {
    console.error('Admin shop PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
