// COMMENTED OUT: Album cover generation temporarily disabled
// import { NextRequest, NextResponse } from 'next/server';
// import { generateAlbumCover } from '@/lib/openai';
// import { ApiResponse, StoryAnalysis, AlbumCover } from '@/types';
// import { generateId } from '@/lib/utils';

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  // COMMENTED OUT: Album cover generation temporarily disabled
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: 'Album cover generation is temporarily disabled',
  }, { status: 503 });

  /* COMMENTED OUT: Original cover generation code
  try {
    const body = await request.json();
    const { storyAnalysis } = body;

    if (!storyAnalysis || typeof storyAnalysis !== 'object') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Story analysis is required',
      }, { status: 400 });
    }

    const imageUrl = await generateAlbumCover(storyAnalysis as StoryAnalysis);

    const albumCover: AlbumCover = {
      id: generateId(),
      imageUrl,
      prompt: `Album cover for: ${storyAnalysis.summary}`,
      status: 'completed',
    };

    return NextResponse.json<ApiResponse<AlbumCover>>({
      success: true,
      data: albumCover,
    });
  } catch (error) {
    console.error('Error generating album cover:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to generate album cover. Please try again.',
    }, { status: 500 });
  }
  */
}