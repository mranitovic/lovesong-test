import { NextRequest, NextResponse } from 'next/server';
import { sunoClient } from '@/lib/suno';
import { downloadAndStoreSong } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { ApiResponse, TaskPollResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, albumSessionId } = body;

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

    // If songs are completed and albumSessionId is provided, store them permanently
    if (result.status === 'completed' && result.songs && albumSessionId) {
      console.log(`🎵 [Poll] Songs completed, storing to S3...`);

      try {
        const storedSongs = await Promise.all(
          result.songs.map(async (song) => {
            const { permanentUrl, key, size } = await downloadAndStoreSong(
              song.audioUrl,
              albumSessionId,
              song.id,
              song.title
            );

            return {
              ...song,
              audioUrl: permanentUrl, // Replace with permanent URL
              sunoUrl: song.audioUrl, // Keep original for reference
              s3Key: key,
              fileSize: size,
              storedAt: new Date().toISOString(),
            };
          })
        );

        // Update database with permanent URLs
        const albumSession = await prisma.albumSession.findUnique({
          where: { id: albumSessionId },
        });

        if (albumSession) {
          const existingSongs = (albumSession.generatedSongs as any[]) || [];

          // Add new songs (avoid duplicates by songId)
          for (const song of storedSongs) {
            const existingIndex = existingSongs.findIndex((s) => s.songId === song.id);
            const songData = {
              songId: song.id,
              title: song.title,
              sunoUrl: song.sunoUrl,
              permanentUrl: song.audioUrl,
              s3Key: song.s3Key,
              storedAt: song.storedAt,
              fileSize: song.fileSize,
              version: song.version,
              duration: song.duration,
              lyrics: song.lyrics,
            };

            if (existingIndex >= 0) {
              existingSongs[existingIndex] = songData;
            } else {
              existingSongs.push(songData);
            }
          }

          await prisma.albumSession.update({
            where: { id: albumSessionId },
            data: { generatedSongs: existingSongs },
          });

          console.log(`✅ [Poll] Songs stored permanently in S3`);
        }

        // Return result with permanent URLs
        return NextResponse.json<ApiResponse<TaskPollResponse>>({
          success: true,
          data: {
            ...result,
            songs: storedSongs,
          },
        });
      } catch (storageError) {
        console.error('❌ [Poll] Error storing songs:', storageError);
        // Return original result if storage fails (graceful degradation)
        return NextResponse.json<ApiResponse<TaskPollResponse>>({
          success: true,
          data: result,
        });
      }
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