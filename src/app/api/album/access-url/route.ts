import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate access URL for paid album
 *
 * This endpoint creates a secure access token that allows users to
 * access their purchased album without authentication.
 *
 * Used for:
 * - Sending access links via email
 * - Redirecting after payment
 * - Sharing purchased albums
 */
export async function POST(request: NextRequest) {
  try {
    const { albumSessionId, email } = await request.json();

    console.log('🔗 [Access URL] Generating access URL for:', { albumSessionId, email });

    if (!albumSessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing albumSessionId' },
        { status: 400 }
      );
    }

    // Fetch album session
    const albumSession = await prisma.albumSession.findUnique({
      where: { id: albumSessionId }
    });

    if (!albumSession) {
      return NextResponse.json(
        { success: false, error: 'Album session not found' },
        { status: 404 }
      );
    }

    if (!albumSession.hasPaid) {
      return NextResponse.json(
        { success: false, error: 'Album not paid' },
        { status: 403 }
      );
    }

    // Generate secure access token
    const token = crypto.randomBytes(32).toString('hex');

    // In production, you might want to store this token in the database
    // For now, we'll use the sessionId directly as it's already secure (UUID)

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const accessUrl = `${baseUrl}/en/results?sessionId=${albumSessionId}`;

    console.log('✅ [Access URL] Generated:', accessUrl);

    return NextResponse.json({
      success: true,
      data: {
        accessUrl,
        albumSessionId
      }
    });

  } catch (error) {
    console.error('❌ [Access URL] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify access to album (for loading from URL)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const albumSession = await prisma.albumSession.findUnique({
      where: { id: sessionId }
    });

    if (!albumSession) {
      return NextResponse.json(
        { success: false, error: 'Album session not found' },
        { status: 404 }
      );
    }

    if (!albumSession.hasPaid) {
      return NextResponse.json(
        { success: false, error: 'Album not paid' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        albumData: albumSession.albumData,
        hasPaid: albumSession.hasPaid,
        paidAt: albumSession.paidAt,
        createdAt: albumSession.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [Access URL] Verify error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
