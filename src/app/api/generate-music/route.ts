import { NextRequest, NextResponse } from 'next/server';
import { sunoClient } from '@/lib/suno';
import { ApiResponse, SongPrompt, GeneratedSong } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songPrompts } = body;

    if (!songPrompts || !Array.isArray(songPrompts)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Song prompts are required and must be an array',
      }, { status: 400 });
    }

    if (songPrompts.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'At least one song prompt is required',
      }, { status: 400 });
    }

    if (songPrompts.length > 10) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Maximum 10 songs can be generated at once',
      }, { status: 400 });
    }

    console.log(`Starting generation of ${songPrompts.length} songs...`);
    
    // Generate songs with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Music generation timed out')), 15 * 60 * 1000) // 15 minutes
    );
    
    const generationPromise = sunoClient.generateMultipleSongs(songPrompts);
    
    const songs = await Promise.race([generationPromise, timeoutPromise]);

    console.log(`Successfully generated ${songs.filter(s => s.status === 'completed').length} out of ${songs.length} songs`);

    return NextResponse.json<ApiResponse<GeneratedSong[]>>({
      success: true,
      data: songs,
    });
  } catch (error) {
    console.error('Error generating music:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to generate music: ${errorMessage}. Please try again.`,
    }, { status: 500 });
  }
}