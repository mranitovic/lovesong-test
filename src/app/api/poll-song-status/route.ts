import { NextRequest, NextResponse } from 'next/server';
import { sunoClient } from '@/lib/suno';
import { ApiResponse, TaskPollResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;

    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Task ID is required and must be a string',
      }, { status: 400 });
    }

    console.log(`Polling status for taskId: ${taskId}`);

    // Poll the task status (single poll, not continuous)
    const result = await sunoClient.pollTaskStatus(taskId);

    console.log(`Task ${taskId} status: ${result.status}`);
    if (result.songs) {
      console.log(`Task ${taskId} returned ${result.songs.length} songs`);
    }

    return NextResponse.json<ApiResponse<TaskPollResponse>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error polling song status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to poll song status: ${errorMessage}`,
    }, { status: 500 });
  }
}