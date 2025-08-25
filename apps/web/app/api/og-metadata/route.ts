import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagePath = searchParams.get('path') || '/';

    // Fetch metadata for the specified page
    const { data: metadata, error } = await supabase
      .from('og_metadata')
      .select('*')
      .eq('page_path', pagePath)
      .single();

    if (error) {
      console.error('Error fetching OG metadata:', error);
      // Return default metadata if not found
      return NextResponse.json({
        title: 'Defeat the Dragon',
        description: 'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
        og_title: 'Defeat the Dragon',
        og_description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
        og_image_url: 'https://dtd.rchetype.xyz/opengraph-image',
        twitter_title: 'Defeat the Dragon',
        twitter_description: 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
        twitter_image_url: 'https://dtd.rchetype.xyz/twitter-image',
        twitter_card_type: 'summary_large_image'
      });
    }

    return NextResponse.json(metadata);

  } catch (error) {
    console.error('OG metadata API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagePath, ...metadata } = body;

    if (!pagePath) {
      return NextResponse.json(
        { error: 'Page path is required' },
        { status: 400 }
      );
    }

    // Upsert metadata for the page
    const { data, error } = await supabase
      .from('og_metadata')
      .upsert({
        page_path: pagePath,
        ...metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'page_path'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating OG metadata:', error);
      return NextResponse.json(
        { error: 'Failed to update metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('OG metadata update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
