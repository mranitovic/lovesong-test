import { NextRequest, NextResponse } from 'next/server';
import { generateLyrics } from '@/lib/openai';
import { ApiResponse, SongPrompt, CoupleNames } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { songPrompt, coupleNames, isFirstSong, locale = 'en' } = body;

    if (!songPrompt || !coupleNames) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Song prompt and couple names are required',
      }, { status: 400 });
    }

    const lyrics = await generateLyrics(
      songPrompt as SongPrompt,
      coupleNames as CoupleNames,
      isFirstSong || false,
      [], // userGenres - empty array for regeneration
      0,  // songIndex - always 0 since only first song can be regenerated
      locale
    );

    return NextResponse.json<ApiResponse<{ lyrics: string }>>({
      success: true,
      data: { lyrics },
    });
  } catch (error) {
    console.error('Error regenerating lyrics:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to regenerate lyrics. Please try again.',
    }, { status: 500 });
  }
}