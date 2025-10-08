import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { albumData } = await request.json();

    if (!albumData) {
      return NextResponse.json(
        { success: false, error: 'Album data is required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        }
      });
    }

    // Create album session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const albumSession = await prisma.albumSession.create({
      data: {
        userId: user.id,
        albumData: albumData,
        expiresAt: expiresAt
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        albumSessionId: albumSession.id,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Error creating album session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Find user and their latest album session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        albumSessions: {
          where: {
            expiresAt: { gt: new Date() } // Not expired
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user || !user.albumSessions.length) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    const albumSession = user.albumSessions[0];

    return NextResponse.json({
      success: true,
      data: {
        albumSessionId: albumSession.id,
        albumData: albumSession.albumData,
        hasPaid: albumSession.hasPaid,
        createdAt: albumSession.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching album session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}