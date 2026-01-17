import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Auto-generate songs after payment confirmation
 *
 * This endpoint is called by the webhook after payment is confirmed.
 * It starts the song generation process for the first song in the album.
 *
 * Flow:
 * 1. Webhook confirms payment
 * 2. Webhook calls this endpoint (async, doesn't block)
 * 3. This endpoint starts song generation
 * 4. User can access results page to see progress
 */
export async function POST(request: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎵 [Auto-Gen] POST-PAYMENT SONG GENERATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { albumSessionId } = await request.json();

    if (!albumSessionId) {
      console.error('❌ [Auto-Gen] Missing albumSessionId');
      return NextResponse.json(
        { success: false, error: 'Missing albumSessionId' },
        { status: 400 }
      );
    }

    console.log('📋 [Auto-Gen] Album Session ID:', albumSessionId);

    // Fetch album session from database
    const albumSession = await prisma.albumSession.findUnique({
      where: { id: albumSessionId }
    });

    if (!albumSession) {
      console.error('❌ [Auto-Gen] Album session not found:', albumSessionId);
      return NextResponse.json(
        { success: false, error: 'Album session not found' },
        { status: 404 }
      );
    }

    if (!albumSession.hasPaid) {
      console.error('❌ [Auto-Gen] Album session not paid yet:', albumSessionId);
      return NextResponse.json(
        { success: false, error: 'Album session not paid' },
        { status: 403 }
      );
    }

    console.log('✅ [Auto-Gen] Album session found and paid');

    const albumData = albumSession.albumData as any;
    const songs = albumData?.analysis?.songs || [];

    if (songs.length === 0) {
      console.error('❌ [Auto-Gen] No songs in album data');
      return NextResponse.json(
        { success: false, error: 'No songs in album' },
        { status: 400 }
      );
    }

    const firstSong = songs[0];
    console.log('🎼 [Auto-Gen] First song:', firstSong.title);

    // Start song generation asynchronously
    // Note: This will be handled by the frontend when user visits results page
    // The results page will detect hasPaid=true and auto-start generation

    // For now, we just log that generation should start
    // The actual generation happens client-side in the results page
    console.log('✅ [Auto-Gen] Album ready for song generation');
    console.log('   User should visit results page to start generation');
    console.log('   Song to generate:', {
      id: firstSong.id,
      title: firstSong.title,
      genre: firstSong.genre,
      mood: firstSong.mood
    });

    // TODO: In future, could trigger server-side generation here
    // For now, client-side generation in results page is sufficient

    return NextResponse.json({
      success: true,
      message: 'Album ready for generation',
      data: {
        albumSessionId,
        songCount: songs.length,
        firstSong: {
          id: firstSong.id,
          title: firstSong.title
        }
      }
    });

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Auto-Gen] ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
