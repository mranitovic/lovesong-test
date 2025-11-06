import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import PaymentConfirmationEmail from '../../../../../emails/PaymentConfirmation';
import AccessGrantedEmail from '../../../../../emails/AccessGranted';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing type or data' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    let emailResult;

    switch (type) {
      case 'payment_confirmation':
        emailResult = await sendEmail({
          to: data.userEmail,
          subject: '✅ Pagamento Confirmado - AI Love Album',
          react: PaymentConfirmationEmail({
            userName: data.userName,
            userEmail: data.userEmail,
            orderId: data.orderId,
            amount: data.amount,
            albumTitle: data.albumTitle,
            appUrl,
            albumSessionId: data.albumSessionId,
            shopDomain: data.shopDomain || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'
          })
        });
        break;

      case 'access_granted':
        emailResult = await sendEmail({
          to: data.userEmail,
          subject: '🔓 Acesso Liberado - Suas Músicas Esperam por Você!',
          react: AccessGrantedEmail({
            userName: data.userName,
            userEmail: data.userEmail,
            albumTitle: data.albumTitle,
            appUrl,
            albumSessionId: data.albumSessionId,
            shopDomain: data.shopDomain || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'
          })
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { emailId: emailResult?.id }
    });

  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
