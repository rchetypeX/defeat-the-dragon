import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dialogueType = searchParams.get('type');
    const randomize = searchParams.get('randomize') === 'true';

    let query = supabase
      .from('character_dialogue_master')
      .select('*')
      .eq('is_active', true);

    if (dialogueType) {
      query = query.eq('dialogue_type', dialogueType);
    }

    const { data: dialogues, error } = await query;

    if (error) {
      console.error('Error fetching character dialogue:', error);
      return NextResponse.json(
        { error: 'Failed to fetch character dialogue' },
        { status: 500 }
      );
    }

    let result = dialogues;

    if (randomize && dialogues.length > 0) {
      // Weighted random selection
      const weightedDialogues: any[] = [];
      dialogues.forEach(dialogue => {
        for (let i = 0; i < dialogue.weight; i++) {
          weightedDialogues.push(dialogue);
        }
      });
      
      const randomIndex = Math.floor(Math.random() * weightedDialogues.length);
      result = [weightedDialogues[randomIndex]];
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Character dialogue API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dialogue_text, dialogue_type, weight } = body;

    if (!dialogue_text) {
      return NextResponse.json(
        { error: 'Dialogue text is required' },
        { status: 400 }
      );
    }

    const { data: newDialogue, error } = await supabase
      .from('character_dialogue_master')
      .insert({
        dialogue_text,
        dialogue_type: dialogue_type || 'general',
        weight: weight || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating character dialogue:', error);
      return NextResponse.json(
        { error: 'Failed to create character dialogue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newDialogue,
    });

  } catch (error) {
    console.error('Character dialogue POST API error:', error);
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
        { error: 'Dialogue ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedDialogue, error } = await supabase
      .from('character_dialogue_master')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating character dialogue:', error);
      return NextResponse.json(
        { error: 'Failed to update character dialogue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDialogue,
    });

  } catch (error) {
    console.error('Character dialogue PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Dialogue ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { data: deletedDialogue, error } = await supabase
      .from('character_dialogue_master')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting character dialogue:', error);
      return NextResponse.json(
        { error: 'Failed to delete character dialogue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedDialogue,
    });

  } catch (error) {
    console.error('Character dialogue DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
