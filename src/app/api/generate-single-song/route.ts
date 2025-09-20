import { NextRequest, NextResponse } from 'next/server';
import { sunoClient } from '@/lib/suno';
import { ApiResponse, SongPrompt, GeneratedSong } from '@/types';

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

    console.log(`Generating individual song: ${songPrompt.title}`);

    // Generate song with timeout (10 minutes for individual song)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Song generation timed out')), 10 * 60 * 1000)
    );

    const generationPromise = sunoClient.generateSingleSong(songPrompt);

    const songs = await Promise.race([generationPromise, timeoutPromise]);

    console.log(`Successfully generated ${songs.length} versions for: ${songPrompt.title}`);

    return NextResponse.json<ApiResponse<GeneratedSong[]>>({
      success: true,
      data: songs,
    });
  } catch (error) {
    console.error('Error generating individual song:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to generate song: ${errorMessage}. Please try again.`,
    }, { status: 500 });
  }
}