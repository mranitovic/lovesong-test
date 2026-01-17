import { NextRequest, NextResponse } from 'next/server';
import { sunoClient } from '@/lib/suno';
import { ApiResponse, SongPrompt, TaskStartResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songPrompt } = body;

    if (!songPrompt || typeof songPrompt !== 'object') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Song prompt is required and must be an object',
      }, { status: 400 });
    }

    // Validate required fields
    if (!songPrompt.title || !songPrompt.prompt || !songPrompt.genre || !songPrompt.mood) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Song prompt must include title, prompt, genre, and mood',
      }, { status: 400 });
    }

    console.log(`Starting song generation for: ${songPrompt.title}`);

    // Start generation and return taskId immediately (don't wait for completion)
    const taskId = await sunoClient.startSongGeneration(songPrompt);

    console.log(`Started song generation with taskId: ${taskId}`);

    return NextResponse.json<ApiResponse<TaskStartResponse>>({
      success: true,
      data: {
        taskId,
        status: 'generating',
      },
    });
  } catch (error) {
    console.error('Error starting song generation:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to start song generation: ${errorMessage}`,
    }, { status: 500 });
  }
}