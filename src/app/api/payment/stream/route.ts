import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Server-Sent Events for real-time payment status updates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const sseData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      };

      // Send initial connection confirmation
      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Poll database for payment status changes
      const checkPaymentStatus = async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            include: {
              albumSessions: {
                where: {
                  expiresAt: { gt: new Date() }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          });

          if (user && user.albumSessions.length > 0) {
            const latestSession = user.albumSessions[0];

            sendEvent({
              type: 'payment_status',
              data: {
                hasPaid: latestSession.hasPaid,
                albumSessionId: latestSession.id,
                paidAt: latestSession.paidAt,
                orderId: latestSession.shopifyOrderId
              }
            });

            // If payment is complete, close the stream
            if (latestSession.hasPaid) {
              sendEvent({ type: 'payment_complete', timestamp: new Date().toISOString() });
              controller.close();
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          sendEvent({ type: 'error', error: 'Failed to check payment status' });
        }
      };

      // Check immediately
      await checkPaymentStatus();

      // Then check every 5 seconds
      const intervalId = setInterval(checkPaymentStatus, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });

      // Auto-close after 5 minutes to prevent indefinite connections
      setTimeout(() => {
        clearInterval(intervalId);
        sendEvent({ type: 'timeout', message: 'Stream closed after 5 minutes' });
        controller.close();
      }, 5 * 60 * 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
