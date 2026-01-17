# Multilanguage Implementation Plan - Complete Guide

## Overview
This document outlines the complete implementation of multilanguage support (EN, PT-BR, DE) for the AI Love Story Song Generator.

---

## ✅ Phase 1: Infrastructure Setup (COMPLETED)

### 1.1 Installed Dependencies
```bash
npm install next-intl
```

### 1.2 Created Core Files
- ✅ `/src/i18n/config.ts` - Locale configuration (en, pt-BR, de)
- ✅ `/src/i18n/request.ts` - Server-side i18n configuration
- ✅ `/src/middleware.ts` - Locale detection and routing
- ✅ `/src/navigation.ts` - i18n-aware navigation helpers
- ✅ `next.config.js` - Updated with next-intl plugin

### 1.3 Translation Files Created
- ✅ `/src/i18n/locales/en.json` - English (200+ strings)
- ✅ `/src/i18n/locales/pt-BR.json` - Brazilian Portuguese
- ✅ `/src/i18n/locales/de.json` - German

### 1.4 Components Created
- ✅ `/src/app/components/LanguageSelector.tsx` - Language switcher UI

---

## 🚧 Phase 2: App Structure Refactoring (IN PROGRESS)

### 2.1 Directory Restructuring
Current structure:
```
src/app/
├── api/
├── components/
├── layout.tsx
├── page.tsx
└── results/
```

Target structure:
```
src/app/
├── [locale]/           # NEW - locale-specific pages
│   ├── layout.tsx      # Locale layout with NextIntlClientProvider
│   ├── page.tsx        # Home page (moved from root)
│   └── results/        # Results page (moved from root)
│       └── page.tsx
├── api/                # Keep API routes outside locale
├── components/         # Shared components
├── layout.tsx          # Root layout (updated)
├── globals.css
└── providers.tsx
```

### 2.2 Steps to Complete
1. ✅ Create `[locale]` directory
2. ✅ Move `page.tsx` to `[locale]/page.tsx`
3. ✅ Move `results/` to `[locale]/results/`
4. ⏳ Create `[locale]/layout.tsx`
5. ⏳ Update root `layout.tsx`
6. ⏳ Update all internal links to use i18n navigation

---

## 🔄 Phase 3: Component Updates with Translations

### 3.1 Priority Order (11 components)

#### **High Priority - User-Facing UI**
1. **MultiStepStoryForm.tsx**
   - Replace hardcoded QUESTIONS array
   - Use `useTranslations('form')`
   - Update validation error messages

2. **QuestionStep.tsx**
   - Use `useTranslations('common')`
   - Translate buttons (Continue, Back)

3. **GenreStep.tsx**
   - Use `useTranslations('genres')`
   - Translate genre names
   - Update UI text

4. **LyricsPreview.tsx**
   - Use `useTranslations('lyricsPreview')`
   - Translate all UI elements

5. **SongPlayer.tsx**
   - Use `useTranslations('songPlayer')`
   - Translate player controls

6. **PaymentGate.tsx**
   - Use `useTranslations('payment')`
   - Translate payment flow

7. **LoadingSpinner.tsx**
   - Use `useTranslations('loadingSpinner')`
   - Translate loading messages

8. **GoogleLoginGate.tsx**
   - Use `useTranslations('loginGate')`
   - Translate login UI

#### **Medium Priority - Page Components**
9. **results/page.tsx**
   - Use `useTranslations('results')`
   - Translate page UI

10. **page.tsx (Home)**
    - Use `useTranslations('home')`
    - Pass locale to form

11. **ProgressIndicator.tsx**
    - Use `useTranslations('form')`
    - Translate progress text

### 3.2 Implementation Pattern

**Before:**
```tsx
<h2>What are your names?</h2>
<button>Continue →</button>
```

**After:**
```tsx
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('form.names');
  const tCommon = useTranslations('common');

  return (
    <>
      <h2>{t('question')}</h2>
      <button>{tCommon('continue')}</button>
    </>
  );
}
```

---

## 🤖 Phase 4: AI Content Localization

### 4.1 Update Types
Add locale to relevant interfaces:

```typescript
// src/types/index.ts
export interface StoryAnswers {
  names: CoupleNames;
  // ... existing fields
  locale?: string; // NEW
}

export interface AlbumData {
  story: string;
  storyAnswers?: StoryAnswers;
  analysis: StoryAnalysis;
  createdAt: string;
  locale: string; // NEW
}
```

### 4.2 Update OpenAI Integration

**File: `src/lib/openai.ts`**

Add locale parameter:
```typescript
export async function analyzeStory(
  story: string,
  coupleNames: CoupleNames,
  userGenres: string[],
  locale: string = 'en' // NEW
): Promise<StoryAnalysis>
```

Update prompt based on locale:
```typescript
const promptsByLocale = {
  'en': `Create 1 beautiful song that captures the essence of their love journey.
         Generate lyrics in English...`,

  'pt-BR': `Crie 1 música linda que capture a essência da jornada de amor deles.
            Gere a letra em Português Brasileiro...`,

  'de': `Erstellen Sie 1 schönes Lied, das die Essenz ihrer Liebesreise einfängt.
         Generiere Liedtexte auf Deutsch...`
};

const prompt = promptsByLocale[locale] || promptsByLocale['en'];
```

### 4.3 Update API Routes

**Files to update:**
- `src/app/api/analyze-story/route.ts`
- `src/app/api/regenerate-lyrics/route.ts`
- `src/app/api/start-song-generation/route.ts`

Accept locale from request body:
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { story, coupleNames, genres, locale = 'en' } = body; // NEW locale

  const analysis = await analyzeStory(story, coupleNames, genres, locale);
  // ...
}
```

---

## 💾 Phase 5: Database Updates

### 5.1 Update Prisma Schema

**File: `prisma/schema.prisma`**

```prisma
model AlbumSession {
  id                 String     @id @default(uuid())
  userId             String
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  albumData          Json
  locale             String     @default("en") // NEW FIELD
  hasPaid            Boolean    @default(false)
  shopifyOrderId     String?    @unique
  shopifyCheckoutId  String?    @unique
  webhookProcessedAt DateTime?
  createdAt          DateTime   @default(now())
  paidAt             DateTime?
  expiresAt          DateTime
  purchases          Purchase[]

  @@index([shopifyCheckoutId])
  @@index([userId, hasPaid])
  @@index([locale]) // NEW INDEX
}
```

### 5.2 Create Migration

```bash
npx prisma migrate dev --name add_locale_to_album_session
```

### 5.3 Update Album Session API

**File: `src/app/api/user/album-session/route.ts`**

Store locale with session:
```typescript
const albumSession = await prisma.albumSession.create({
  data: {
    userId: user.id,
    albumData: albumData,
    locale: albumData.locale || 'en', // NEW
    expiresAt: expiresAt
  }
});
```

---

## 📧 Phase 6: Email Localization

### 6.1 Update Email Templates

**File: `emails/PaymentConfirmation.tsx`**

```typescript
interface PaymentConfirmationProps {
  // ... existing props
  locale?: string;
}

const translations = {
  en: {
    subject: 'Payment Confirmed!',
    title: 'Thank you for your purchase',
    // ...
  },
  'pt-BR': {
    subject: 'Pagamento Confirmado!',
    title: 'Obrigado pela sua compra',
    // ...
  },
  de: {
    subject: 'Zahlung bestätigt!',
    title: 'Vielen Dank für Ihren Kauf',
    // ...
  }
};

export default function PaymentConfirmation({ locale = 'en', ...props }: PaymentConfirmationProps) {
  const t = translations[locale];
  return (
    <Html>
      <Head />
      <Body>
        <Heading>{t.title}</Heading>
        {/* ... */}
      </Body>
    </Html>
  );
}
```

### 6.2 Update Email Sending Logic

**File: `src/lib/email.ts`**

Pass locale to email templates:
```typescript
await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: email,
  subject: getSubject(locale),
  react: PaymentConfirmation({
    ...data,
    locale: albumSession.locale
  })
});
```

---

## 🔗 Phase 7: Navigation Updates

### 7.1 Update All Links

Replace Next.js `Link` with i18n `Link`:

**Before:**
```tsx
import Link from 'next/link';
<Link href="/results">Results</Link>
```

**After:**
```tsx
import { Link } from '@/navigation';
<Link href="/results">Results</Link>
```

### 7.2 Update Redirects

Replace `useRouter` from `next/navigation`:

**Before:**
```tsx
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/results');
```

**After:**
```tsx
import { useRouter } from '@/navigation';
const router = useRouter();
router.push('/results'); // Automatically adds locale prefix
```

---

## 🎨 Phase 8: UI Integration

### 8.1 Add Language Selector to Layouts

**In `[locale]/layout.tsx`:**
```tsx
import LanguageSelector from '@/app/components/LanguageSelector';

export default function LocaleLayout({ children, params }: Props) {
  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="min-h-screen">
        {/* Header with language selector */}
        <header className="p-4 flex justify-end">
          <LanguageSelector />
        </header>

        {children}
      </div>
    </NextIntlClientProvider>
  );
}
```

### 8.2 Persist Locale Choice

Store in cookie/localStorage:
```typescript
// In LanguageSelector.tsx
function handleLocaleChange(newLocale: Locale) {
  localStorage.setItem('preferredLocale', newLocale);
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
  router.replace(pathname, { locale: newLocale });
}
```

---

## ✅ Testing Checklist

### For Each Language (EN, PT-BR, DE):

#### **Form Flow**
- [ ] Language selector visible and working
- [ ] All 7 form questions display in correct language
- [ ] Validation errors in correct language
- [ ] Genre names translated
- [ ] Progress indicator shows translated text

#### **AI Generation**
- [ ] Song lyrics generated in selected language
- [ ] Story analysis summary in correct language
- [ ] Genre selection reflected in song style

#### **Payment Flow**
- [ ] Payment gate UI fully translated
- [ ] Price display formatted correctly (R$ for all)
- [ ] Payment benefits listed in correct language
- [ ] Shopify redirect works (keeps locale context)

#### **Results Page**
- [ ] Page title and descriptions translated
- [ ] Song player controls in correct language
- [ ] Download buttons labeled correctly
- [ ] Error messages in correct language

#### **Email Notifications**
- [ ] Payment confirmation email in user's language
- [ ] Access granted email in user's language

#### **Edge Cases**
- [ ] Language switching mid-form preserves data
- [ ] Lyrics regeneration maintains locale
- [ ] Direct URL access with locale works (`/pt-BR/results`)
- [ ] Invalid locale redirects to default (en)
- [ ] SEO meta tags update per locale

---

## 📝 Implementation Checklist

### Phase 1: Infrastructure ✅
- [x] Install next-intl
- [x] Create i18n config files
- [x] Create middleware
- [x] Update next.config.js
- [x] Create translation JSON files (3 languages)
- [x] Create LanguageSelector component

### Phase 2: App Restructuring 🔄
- [x] Create [locale] directory
- [x] Move pages to [locale]
- [ ] Create [locale]/layout.tsx
- [ ] Update root layout.tsx
- [ ] Test routing with all locales

### Phase 3: Component Updates ⏳
- [ ] MultiStepStoryForm
- [ ] QuestionStep
- [ ] GenreStep
- [ ] LyricsPreview
- [ ] SongPlayer
- [ ] PaymentGate
- [ ] LoadingSpinner
- [ ] GoogleLoginGate
- [ ] Results page
- [ ] Home page
- [ ] ProgressIndicator

### Phase 4: AI Integration ⏳
- [ ] Update types with locale field
- [ ] Update OpenAI analyzeStory function
- [ ] Update generateLyrics function
- [ ] Update API routes to accept locale
- [ ] Test song generation in all 3 languages

### Phase 5: Database ⏳
- [ ] Add locale field to schema
- [ ] Create migration
- [ ] Update album-session API to store locale
- [ ] Test database operations

### Phase 6: Email Localization ⏳
- [ ] Update PaymentConfirmation template
- [ ] Update AccessGranted template
- [ ] Update email sending logic
- [ ] Test emails in all 3 languages

### Phase 7: Navigation ⏳
- [ ] Replace all Link imports
- [ ] Replace all useRouter imports
- [ ] Test navigation between pages

### Phase 8: Final Testing ⏳
- [ ] Test complete flow in English
- [ ] Test complete flow in Portuguese
- [ ] Test complete flow in German
- [ ] Test language switching
- [ ] Test edge cases
- [ ] Performance testing

---

## 🚀 Deployment Notes

### Environment Variables
No new environment variables needed.

### Build Process
```bash
npm run build
```

Next-intl is fully compatible with static export and serverless deployment.

### Vercel Deployment
Automatically handles locale routing. No special configuration needed.

---

## 📊 Translation Coverage

### Total Strings Per Language: ~200

**Breakdown:**
- Common UI: 10 strings
- Form questions: 50 strings
- Genres: 10 strings
- Components: 80 strings
- Errors: 10 strings
- Payment: 20 strings
- Results: 15 strings
- Metadata: 5 strings

**Total across 3 languages: ~600 translations**

---

## 🔍 Key Files Modified/Created

### New Files (14):
1. `src/middleware.ts`
2. `src/navigation.ts`
3. `src/i18n/config.ts`
4. `src/i18n/request.ts`
5. `src/i18n/locales/en.json`
6. `src/i18n/locales/pt-BR.json`
7. `src/i18n/locales/de.json`
8. `src/app/components/LanguageSelector.tsx`
9. `src/app/[locale]/layout.tsx`
10. `src/app/[locale]/page.tsx` (moved)
11. `src/app/[locale]/results/page.tsx` (moved)
12. `prisma/migrations/XXXX_add_locale/migration.sql`
13. `MULTILANGUAGE_IMPLEMENTATION_PLAN.md` (this file)

### Modified Files (20+):
1. `next.config.js`
2. `package.json`
3. `src/app/layout.tsx`
4. `src/types/index.ts`
5. `src/lib/openai.ts`
6. All 11 component files
7. `src/app/api/analyze-story/route.ts`
8. `src/app/api/regenerate-lyrics/route.ts`
9. `src/app/api/user/album-session/route.ts`
10. `emails/PaymentConfirmation.tsx`
11. `emails/AccessGranted.tsx`
12. `prisma/schema.prisma`

---

## 💡 Tips & Best Practices

1. **Always use translation keys**: Never hardcode strings
2. **Consistent naming**: Keep translation keys organized by feature
3. **Fallback to English**: If translation missing, show English
4. **Test thoroughly**: Each language needs full QA pass
5. **Genre mapping**: Internal genre IDs (rock, pop) stay same, only display names translate
6. **AI prompts**: Ensure AI instructions are clear in each language
7. **Validation**: Error messages must be locale-specific
8. **Date/Number formatting**: Use Intl API for proper formatting

---

## 🆘 Troubleshooting

### "Messages are not configured"
- Ensure `NextIntlClientProvider` wraps components
- Check messages prop is passed correctly

### Locale not detected
- Verify middleware.ts is running
- Check matcher pattern in middleware config

### Translations not showing
- Verify JSON file syntax (valid JSON)
- Check translation key path matches usage
- Clear .next cache and rebuild

### Database migration fails
- Backup database first
- Check Prisma schema syntax
- Run `npx prisma format` before migrating

---

**Current Status:** Infrastructure complete, app restructuring in progress
**Next Steps:** Complete layouts, then update all 11 components
**Estimated Time Remaining:** 3-4 hours for full implementation
