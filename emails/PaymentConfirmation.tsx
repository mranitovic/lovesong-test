import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentConfirmationEmailProps {
  userName?: string;
  userEmail: string;
  orderId: string;
  amount: number;
  albumTitle: string;
  appUrl: string;
  albumSessionId: string;
  shopDomain: string;
}

export const PaymentConfirmationEmail = ({
  userName,
  userEmail,
  orderId,
  amount,
  albumTitle,
  appUrl,
  albumSessionId,
  shopDomain,
}: PaymentConfirmationEmailProps) => {
  const previewText = `Pagamento confirmado! Seu álbum "${albumTitle}" está pronto.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🎵 Pagamento Confirmado!</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              Olá{userName ? ` ${userName}` : ''}! 👋
            </Text>

            <Text style={text}>
              Seu pagamento foi processado com sucesso! Agora você tem acesso completo ao seu álbum personalizado: <strong>{albumTitle}</strong>.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>ID do Pedido:</strong> {orderId}
              </Text>
              <Text style={infoText}>
                <strong>Valor:</strong> R$ {amount.toFixed(2)}
              </Text>
              <Text style={infoText}>
                <strong>Email:</strong> {userEmail}
              </Text>
            </Section>

            <Section style={benefits}>
              <Heading as="h2" style={h2}>
                ✨ O que você ganhou:
              </Heading>
              <Text style={bulletPoint}>✓ Acesso a todas as 5 músicas personalizadas</Text>
              <Text style={bulletPoint}>✓ Download em alta qualidade (MP3)</Text>
              <Text style={bulletPoint}>✓ Acesso vitalício ao seu álbum</Text>
              <Text style={bulletPoint}>✓ Letras personalizadas baseadas na sua história</Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={`https://${shopDomain}/pages/album?sessionId=${albumSessionId}`}>
                🎧 Acessar Meu Álbum Pago
              </Button>
            </Section>

            <Text style={text}>
              Suas músicas estão prontas para serem acessadas e geradas. Clique no botão acima para acessar seu álbum dentro da nossa loja e começar a gerar suas músicas personalizadas.
            </Text>

            <Text style={footerText}>
              Se você tiver qualquer dúvida, responda a este email e teremos prazer em ajudar!
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} AI Love Album. Todos os direitos reservados.
            </Text>
            <Text style={footerText}>
              Este email foi enviado para {userEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  backgroundColor: '#ec4899',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
  lineHeight: '1.3',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  margin: '24px 0 16px',
};

const content = {
  padding: '0 40px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoText = {
  color: '#1f2937',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const benefits = {
  margin: '32px 0',
};

const bulletPoint = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '8px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ec4899',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const footer = {
  padding: '24px 40px',
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '8px 0',
};
