import { Resend } from 'resend';

// Allow build to succeed without API key
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

export interface EmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: EmailOptions) {
  // Runtime check for API key
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AI Love Album <noreply@yourdomain.com>',
      to: [to],
      subject,
      react
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Email sent successfully to ${to}:`, data?.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

export { resend };
