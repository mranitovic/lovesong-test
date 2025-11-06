# [Love-Stories.ai](http://Love-Stories.ai) - Meta events

# 🎯 Meta Pixel & Event Tracking Setup — [LoveStories.ai](http://lovestories.ai/)

**Pixel ID:** `1218782143628327`

**Platforms:** Shopify + Vercel App

**Last Updated:** October 2025

**Author:** [LoveStories.ai](http://lovestories.ai/)

---

## 🧩 Overview

This document describes the full **Meta Pixel event tracking architecture** for [LoveStories.ai](http://lovestories.ai/) — connecting the **Shopify storefront** and the **AI Song Builder (Vercel app)**.

Goal: capture every key user action for accurate analytics, conversion optimization, and retargeting through Meta Ads.

---

## 🧭 Visual Funnel Overview

[Shopify Store]

↓

ViewContent

ClickBuyNow

↓

───────────────────────────────

→ Redirect to Vercel (AI Song Builder)

───────────────────────────────

↓

SongCreationPageView

SongCreationStarted

SongRecipientSelected

SongInputsCompleted

SongPreviewPlayed

SongPreviewRegenerated

SongCheckoutStarted

SongCreationAbandoned

↓

───────────────────────────────

→ Redirect to Shopify Checkout

───────────────────────────────

↓

InitiateCheckout

Purchase

↓

───────────────────────────────

→ Post-Purchase Flow

───────────────────────────────

↓

SongDelivered

SongPlayed

```

💡 *Events in bold are standard Meta events. Others are custom events for granular optimization.*

---

## ⚙️ Base Pixel Code (for Vercel App)

> Shopify automatically installs and manages the Pixel; this snippet is required only for the **Vercel App** (https://poc-songs-album.vercel.app/).

```html
<!-- Meta Pixel Base Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1218782143628327');
fbq('track', 'PageView');
</script>

```

---

## 🛍️ Shopify Events

| **Step** | **Trigger** | **Event Name** | **Payload** | **Description** |
| --- | --- | --- | --- | --- |
| 1 | Product page load | `ViewContent` | `{ content_name: 'AI Love Song', currency: 'BRL' }` | Standard Meta view event |
| 2 | “Buy Now” button clicked | `ClickBuyNow` | `{ source: 'Shopify Product Page' }` | Entry point to creation flow |
| 3 | Checkout initiated | `InitiateCheckout` | `{ currency: 'BRL' }` | Shopify standard event |
| 4 | Purchase completed | `Purchase` | `{ value: {{total_price}}, currency: 'BRL' }` | Automatically sent via Shopify CAPI |

---

## 🎶 Vercel App (AI Song Builder) Events

> Implement with fbq('trackCustom', 'EventName', { ... })
> 

| **Step** | **User Action / Trigger** | **Event Name** | **Payload Example** | **Purpose** |
| --- | --- | --- | --- | --- |
| 1 | Page loaded | `SongCreationPageView` | `{ step: 1 }` | Track entry to app |
| 2 | User clicks “Start” | `SongCreationStarted` | `{ source: 'Shopify', step: 1 }` | Detect engaged visitors |
| 3 | Recipient selected | `SongRecipientSelected` | `{ recipient_type: 'girlfriend', step: 2 }` | Track personalization data |
| 4 | Inputs completed | `SongInputsCompleted` | `{ fields_completed: true, step: 3 }` | Qualified user intent |
| 5 | Preview played | `SongPreviewPlayed` | `{ song_id: 'TEMP123', step: 4 }` | Engagement measure |
| 6 | Preview regenerated | `SongPreviewRegenerated` | `{ song_id: 'TEMP123', regenerate: true }` | Optimization insight |
| 7 | Click “Buy Song” | `SongCheckoutStarted` | `{ song_id: 'TEMP123', step: 5 }` | Key conversion trigger |
| 8 | User abandons session | `SongCreationAbandoned` | `{ step: 3, reason: 'idle' }` | Retargeting opportunity |

---

## 📦 Post-Purchase Events

| **Step** | **Trigger** | **Event Name** | **Payload** | **Purpose** |
| --- | --- | --- | --- | --- |
| 1 | Shopify thank-you page | `Purchase` | (auto-fired) | Confirmed conversion |
| 2 | Song delivery email opened | `SongDelivered` | `{ song_id: '123', delivery_method: 'email' }` | Track delivery success |
| 3 | Song played from email/download | `SongPlayed` | `{ song_id: '123', delivery_source: 'email' }` | Engagement after purchase |

---

## ⚙️ Optional Advanced Tracking

| **Event** | **When to Fire** | **Purpose** |
| --- | --- | --- |
| `FormStepViewed` | At each step of the creation form | Step-level funnel analytics |
| `SongLanguageSelected` | User picks language (EN/PT/DE) | Audience segmentation |
| `ErrorOccurred` | API timeout or failed preview | QA and reliability tracking |
| `PageExitIntent` | Cursor leaves window / back button hover | Retargeting signal |
| `ScrollDepth` | User scrolls ≥75% on landing page | Engagement metric |

---

## 🧠 Developer Notes

- ✅ Use the **same Pixel ID** (`1218782143628327`) on both Shopify & Vercel.
- ✅ All custom events must use:
    
    ```jsx
    if (typeof fbq === 'function') {
      fbq('trackCustom', 'EventName', { ... });
    }
    
    ```
    
- ✅ Test events in **Meta Events Manager → Test Events**.
- ✅ In Shopify’s “Facebook & Instagram” sales channel, set **Data Sharing = Maximum**.
- ⚠️ Avoid firing events twice (e.g., during page reload).
- 🧩 For development, log events to console for debugging:
    
    ```jsx
    console.log('Pixel Event Fired:', 'EventName', payload);
    
    ```
    

---

## ✅ Handoff Checklist

- [x]  Pixel installed on Vercel app
- [x]  All custom fbq events added and tested
- [ ]  Pixel verified in Meta Events Manager
- [ ]  Shopify CAPI active and "Maximum" data sharing enabled
- [ ]  Custom conversions created for:
    - `SongCreationStarted`
    - `SongInputsCompleted`
    - `SongPreviewPlayed`
    - `SongCheckoutStarted`
    - `Purchase`
- [ ]  Funnel tested end-to-end: Shopify → Vercel → Shopify

---

## 🚀 Implementation Summary

### ✅ Completed (Core Vercel App Events)

**Files Created:**
- `src/lib/tracking.ts` - Type-safe Meta Pixel tracking utility with error handling and dev logging

**Files Modified:**
- `src/app/[locale]/layout.tsx` - Meta Pixel base code installed in `<head>`
- `src/app/[locale]/page.tsx` - Form page tracking (PageView, Started, Completed, Abandoned)
- `src/app/components/MultiStepStoryForm.tsx` - Step tracking (RecipientSelected)
- `src/app/[locale]/results/page.tsx` - Results tracking (PreviewRegenerated)
- `src/app/components/SongPlayer.tsx` - Song play tracking (PreviewPlayed)
- `src/app/components/PaymentGate.tsx` - Checkout tracking (CheckoutStarted)

**Events Implemented:**
1. ✅ `SongCreationPageView` - Fires on form page mount
2. ✅ `SongCreationStarted` - Fires on first user input
3. ✅ `SongRecipientSelected` - Fires when names step completed
4. ✅ `SongInputsCompleted` - Fires when form submitted
5. ✅ `SongPreviewPlayed` - Fires when song audio plays
6. ✅ `SongPreviewRegenerated` - Fires when lyrics regenerated
7. ✅ `SongCheckoutStarted` - Fires when "Buy Now" clicked
8. ✅ `SongCreationAbandoned` - Fires after 3 minutes of inactivity

**Technical Decisions:**
- Pixel in root layout (applies to all pages)
- 3-minute idle timer for abandonment detection
- Client-side tracking with TypeScript safety
- Dev mode console logging for testing
- Error handling for missing `fbq` function

### 📋 Deferred (Future Implementation)
- Email tracking events (`SongDelivered`, `SongPlayed`) - requires backend email service integration
- Shopify events - already handled by Shopify's built-in pixel integration

### 🧪 Next Steps
1. ✅ Deploy to production - **COMPLETED** (https://poc-songs-album.vercel.app)
2. ⏳ Test all events using Meta Events Manager → Test Events
3. ⏳ Create custom conversions in Meta Ads Manager
4. ⏳ End-to-end funnel test: Shopify → Vercel → Checkout → Thank You
5. ⏳ Configure Shopify CAPI with "Maximum" data sharing

### 🧪 Testing Instructions

**To test Meta Pixel events in development:**
1. Open browser console and look for `📊 [Meta Pixel]` logs
2. Navigate through the song creation flow
3. Check that events fire at the right times

**To test in Meta Events Manager:**
1. Go to Meta Events Manager (https://business.facebook.com/events_manager)
2. Select your Pixel (ID: 1218782143628327)
3. Click "Test Events"
4. Enter your test URL (e.g., https://poc-songs-album.vercel.app)
5. Complete the user flow and verify all events appear in the Test Events panel

**Expected Event Sequence:**
1. PageView (automatic on every page load)
2. SongCreationPageView (when form page loads)
3. SongCreationStarted (on first input)
4. SongRecipientSelected (after entering names)
5. SongInputsCompleted (after form submission)
6. SongPreviewPlayed (when audio plays)
7. SongPreviewRegenerated (if lyrics regenerated)
8. SongCheckoutStarted (when "Buy Now" clicked)
9. SongCreationAbandoned (if idle for 3 minutes)

---

## 🧾 Event Hierarchy Summary