import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return default inventory data
    // In a real app, this would check user authentication and return user-specific inventory
    // Using item_key values that match the shop_items_master table
    const defaultInventory = [
      {
        id: 'default-fighter',
        user_id: 'default',
        item_id: 'fighter',
        item_type: 'character',
        quantity: 1,
        equipped: true,
        acquired_at: new Date().toISOString()
      },
      {
        id: 'default-forest',
        user_id: 'default',
        item_id: 'forest',
        item_type: 'background',
        quantity: 1,
        equipped: true,
        acquired_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: defaultInventory,
    });

  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
