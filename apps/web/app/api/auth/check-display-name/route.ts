import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { displayName } = await request.json();

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid display name' },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim();

    // Basic validation
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 20) {
      return NextResponse.json(
        { error: 'Display name must be 20 characters or less' },
        { status: 400 }
      );
    }

    // Check for invalid characters (basic check)
    const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validNameRegex.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Display name can only contain letters, numbers, spaces, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Display names no longer need to be unique - always available
    const isAvailable = true;

    return NextResponse.json({
      isAvailable,
      displayName: trimmedName,
    });

  } catch (error) {
    console.error('Check display name error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
