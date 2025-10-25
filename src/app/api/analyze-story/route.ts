import { NextRequest, NextResponse } from 'next/server';
import { analyzeStory } from '@/lib/openai';
import { validateStory } from '@/lib/utils';
import { ApiResponse, StoryAnalysis, CoupleNames } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story, coupleNames, genres, locale = 'en' } = body;

    if (!story || typeof story !== 'string') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Story is required and must be a string',
      }, { status: 400 });
    }

    if (!coupleNames || !coupleNames.person1 || !coupleNames.person2) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Couple names are required',
      }, { status: 400 });
    }

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'At least one music genre is required',
      }, { status: 400 });
    }

    const validationError = validateStory(story);
    if (validationError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: validationError,
      }, { status: 400 });
    }

    const analysis = await analyzeStory(story, coupleNames as CoupleNames, genres as string[], locale);

    return NextResponse.json<ApiResponse<StoryAnalysis>>({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing story:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Failed to analyze story. Please try again.',
    }, { status: 500 });
  }
}