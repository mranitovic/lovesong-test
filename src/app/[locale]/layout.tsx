import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { Providers } from '../providers';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import LanguageSelector from '../components/LanguageSelector';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const messages = await getMessages();
  const metadata = messages.metadata as any;

  return {
    title: metadata?.title || 'AI Love Story Song Generator',
    description: metadata?.description || 'Turn your love story into a personalized AI-generated song',
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Provide messages to client components
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {/* Language Selector - Fixed position */}
            <div className="fixed top-4 right-4 z-50">
              <LanguageSelector />
            </div>

            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
