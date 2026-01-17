export const locales = ['en', 'pt-BR', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português',
  de: 'Deutsch'
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  'pt-BR': '🇧🇷',
  de: '🇩🇪'
};
