import { NextRequest, NextResponse } from 'next/server';
import { calculateLevel } from '../../../../lib/levelUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testXp = parseInt(searchParams.get('xp') || '142');

    // Test the level calculation
    const result = await calculateLevel(testXp);

    return NextResponse.json({
      success: true,
      testXp,
      result,
      expectedLevel: testXp >= 133 ? 3 : testXp >= 50 ? 2 : 1
    });

  } catch (error) {
    console.error('Level calculation test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testXp: parseInt(request.nextUrl.searchParams.get('xp') || '142')
      },
      { status: 500 }
    );
  }
}
