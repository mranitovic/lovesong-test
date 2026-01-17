import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadAndStoreSong } from '@/lib/storage';

interface StoreSongRequest {
  albumSessionId: string;
  songId: string;
  songTitle: string;
  sunoUrl: string;
  version?: 'A' | 'B';
  duration?: number;
  lyrics?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StoreSongRequest = await request.json();
    const { albumSessionId, songId, songTitle, sunoUrl, version, duration, lyrics } = body;

    console.log(`🎵 [Store Song] Storing song: ${songTitle}`);

    // Validate required fields
    if (!albumSessionId || !songId || !songTitle || !sunoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Download from Suno and upload to S3
    const { permanentUrl, key, size } = await downloadAndStoreSong(
      sunoUrl,
      albumSessionId,
      songId,
      songTitle
    );

    // 2. Update database with permanent URL
    const albumSession = await prisma.albumSession.findUnique({
      where: { id: albumSessionId },
    });

    if (!albumSession) {
      return NextResponse.json(
        { success: false, error: 'Album session not found' },
        { status: 404 }
      );
    }

    // Get existing generated songs or initialize empty array
    const generatedSongs = (albumSession.generatedSongs as any[]) || [];

    // Add or update this song
    const existingIndex = generatedSongs.findIndex((s) => s.songId === songId);

    const songData = {
      songId,
      title: songTitle,
      sunoUrl, // Original Suno URL (for reference)
      permanentUrl, // S3 permanent URL
      s3Key: key,
      storedAt: new Date().toISOString(),
      fileSize: size,
      version: version || 'A',
      duration,
      lyrics,
    };

    if (existingIndex >= 0) {
      generatedSongs[existingIndex] = songData;
    } else {
      generatedSongs.push(songData);
    }

    // Save to database
    await prisma.albumSession.update({
      where: { id: albumSessionId },
      data: { generatedSongs },
    });

    console.log(`✅ [Store Song] Saved to database: ${permanentUrl}`);

    return NextResponse.json({
      success: true,
      data: {
        permanentUrl,
        s3Key: key,
        storedAt: songData.storedAt,
        fileSize: size,
      },
    });
  } catch (error) {
    console.error('❌ [Store Song] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store song',
      },
      { status: 500 }
    );
  }
}
