import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Create anonymous album session (no authentication required)
 * Used for iframe purchases where OAuth doesn't work
 */
export async function POST(request: NextRequest) {
  try {
    const { albumData } = await request.json();

    if (!albumData) {
      return NextResponse.json(
        { success: false, error: 'Album data is required' },
        { status: 400 }
      );
    }

    // Check if an album session already exists for this album (by createdAt timestamp)
    const albumCreatedAt = albumData.createdAt;

    if (albumCreatedAt) {
      const existingSession = await prisma.albumSession.findFirst({
        where: {
          albumData: {
            path: ['createdAt'],
            equals: albumCreatedAt
          },
          expiresAt: { gt: new Date() } // Not expired
        }
      });

      // If existing session found, return it (idempotent)
      if (existingSession) {
        console.log(`✅ Returning existing anonymous album session: ${existingSession.id}`);
        return NextResponse.json({
          success: true,
          data: {
            albumSessionId: existingSession.id,
            hasPaid: existingSession.hasPaid,
            existing: true
          }
        });
      }
    }

    // Create new anonymous album session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const albumSession = await prisma.albumSession.create({
      data: {
        userId: null, // Anonymous user (iframe purchase)
        albumData: albumData,
        expiresAt: expiresAt
      }
    });

    console.log(`🆕 Created new anonymous album session: ${albumSession.id}`);

    return NextResponse.json({
      success: true,
      data: {
        albumSessionId: albumSession.id,
        hasPaid: false,
        existing: false
      }
    });

  } catch (error) {
    console.error('Error creating anonymous album session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
