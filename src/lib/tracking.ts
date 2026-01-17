/**
 * Meta Pixel Tracking Utility
 *
 * Provides type-safe wrapper for Meta Pixel (fbq) events.
 * Includes dev mode logging and error handling.
 */

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom',
      eventName: string,
      parameters?: Record<string, any>
    ) => void;
  }
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * Track a Meta Pixel custom event
 * @param eventName - The name of the custom event
 * @param parameters - Optional event parameters
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>
): void {
  try {
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    // Log in development mode
    if (isDev) {
      console.log('📊 [Meta Pixel]', eventName, parameters || {});
    }

    // Track the event if fbq is available
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, parameters);
    } else if (isDev) {
      console.warn('⚠️ [Meta Pixel] fbq is not loaded');
    }
  } catch (error) {
    console.error('❌ [Meta Pixel] Error tracking event:', eventName, error);
  }
}

/**
 * Track standard Meta Pixel event (PageView, Purchase, etc.)
 * @param eventName - The name of the standard event
 * @param parameters - Optional event parameters
 */
export function trackStandardEvent(
  eventName: string,
  parameters?: Record<string, any>
): void {
  try {
    if (typeof window === 'undefined') {
      return; // Skip on server-side
    }

    // Log in development mode
    if (isDev) {
      console.log('📊 [Meta Pixel - Standard]', eventName, parameters || {});
    }

    // Track the event if fbq is available
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, parameters);
    } else if (isDev) {
      console.warn('⚠️ [Meta Pixel] fbq is not loaded');
    }
  } catch (error) {
    console.error('❌ [Meta Pixel] Error tracking standard event:', eventName, error);
  }
}

// Specific event tracking functions for type safety and convenience

export const MetaPixelEvents = {
  // Song Creation Flow Events
  songCreationPageView: (step: number = 1) => {
    trackEvent('SongCreationPageView', { step });
  },

  songCreationStarted: (source: string = 'Shopify') => {
    trackEvent('SongCreationStarted', { source, step: 1 });
  },

  songRecipientSelected: (recipientType: string) => {
    trackEvent('SongRecipientSelected', { recipient_type: recipientType, step: 2 });
  },

  songInputsCompleted: () => {
    trackEvent('SongInputsCompleted', { fields_completed: true, step: 3 });
  },

  songPreviewPlayed: (songId: string) => {
    trackEvent('SongPreviewPlayed', { song_id: songId, step: 4 });
  },

  songPreviewRegenerated: (songId: string) => {
    trackEvent('SongPreviewRegenerated', { song_id: songId, regenerate: true });
  },

  songCheckoutStarted: (songId: string) => {
    trackEvent('SongCheckoutStarted', { song_id: songId, step: 5 });
  },

  songCreationAbandoned: (step: number, reason: string = 'idle') => {
    trackEvent('SongCreationAbandoned', { step, reason });
  },

  // Post-Purchase Events (for future implementation)
  songDelivered: (songId: string, deliveryMethod: string = 'email') => {
    trackEvent('SongDelivered', { song_id: songId, delivery_method: deliveryMethod });
  },

  songPlayed: (songId: string, deliverySource: string = 'email') => {
    trackEvent('SongPlayed', { song_id: songId, delivery_source: deliverySource });
  },
};
