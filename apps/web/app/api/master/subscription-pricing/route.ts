import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get subscription pricing from master table
    const { data: pricing, error } = await supabase
      .from('subscription_pricing_master')
      .select('*')
      .eq('is_active', true)
      .order('subscription_type');

    if (error) {
      console.error('Error fetching subscription pricing:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription pricing' },
        { status: 500 }
      );
    }

    // Transform data for easier consumption
    const pricingMap = pricing.reduce((acc, item) => {
      acc[item.subscription_type] = {
        id: item.id,
        subscription_type: item.subscription_type,
        price_usd: item.price_usd,
        price_usdc: item.price_usdc,
        duration_days: item.duration_days,
        description: item.description,
        benefits: item.benefits || [],
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: pricingMap
    });

  } catch (error) {
    console.error('Subscription pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Add POST endpoint for admin updates (protected by service role)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_type, price_usdc, price_usd, duration_days, description, benefits, is_active } = body;

    // Validate required fields
    if (!subscription_type || price_usdc === undefined || duration_days === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription_type, price_usdc, duration_days' },
        { status: 400 }
      );
    }

    // Update or insert pricing
    const { data, error } = await supabase
      .from('subscription_pricing_master')
      .upsert({
        subscription_type,
        price_usdc,
        price_usd: price_usd || 0,
        duration_days,
        description,
        benefits,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription pricing:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Subscription pricing update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
