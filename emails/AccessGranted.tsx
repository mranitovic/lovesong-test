import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AccessGrantedEmailProps {
  userName?: string;
  userEmail: string;
  albumTitle: string;
  appUrl: string;
  albumSessionId: string;
  shopDomain: string;
}

export const AccessGrantedEmail = ({
  userName,
  userEmail,
  albumTitle,
  appUrl,
  albumSessionId,
  shopDomain,
}: AccessGrantedEmailProps) => {
  const previewText = `Suas músicas foram desbloqueadas! Acesse seu álbum agora.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🔓 Acesso Liberado!</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>
              Olá{userName ? ` ${userName}` : ''}! 🎉
            </Text>

            <Text style={text}>
              Seu pagamento foi confirmado e agora você tem acesso completo ao seu álbum: <strong>{albumTitle}</strong>!
            </Text>

            <Text style={text}>
              As 4 músicas restantes foram desbloqueadas e estão prontas para serem geradas.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                🎵 5 músicas personalizadas baseadas na sua história de amor
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={`https://${shopDomain}/pages/album?sessionId=${albumSessionId}`}>
                🎧 Acessar Meu Álbum Pago
              </Button>
            </Section>

            <Text style={text}>
              Cada música captura um momento especial da sua jornada. Clique no botão acima para começar a gerar e ouvir suas músicas agora!
            </Text>

            <Text style={instructionsText}>
              <strong>Como funciona:</strong><br />
              1. Acesse seu álbum através do link acima<br />
              2. Clique em "Gerar" para cada música<br />
              3. Aguarde alguns minutos enquanto a IA cria sua música<br />
              4. Ouça e faça download quando estiver pronta!
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

export default AccessGrantedEmail;

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
  backgroundColor: '#10b981',
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

const content = {
  padding: '0 40px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const highlightBox = {
  backgroundColor: '#d1fae5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const highlightText = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
};

const instructionsText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
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
