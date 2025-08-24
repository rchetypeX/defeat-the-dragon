import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

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
