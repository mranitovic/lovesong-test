import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Find user by email
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
        data: {
          hasPaid: false,
          albumSessionId: null
        }
      });
    }

    const latestSession = user.albumSessions[0];

    return NextResponse.json({
      success: true,
      data: {
        hasPaid: latestSession.hasPaid,
        albumSessionId: latestSession.id,
        paidAt: latestSession.paidAt,
        orderId: latestSession.shopifyOrderId
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}