'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentGate from '@/app/components/PaymentGate';
import GoogleLoginGate from '@/app/components/GoogleLoginGate';
import { useSession } from 'next-auth/react';

/**
 * Shopify Widget Results Page
 *
 * This page shows the payment gate for customers in the Shopify storefront.
 * It handles authentication and payment flow within the iframe context.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function ShopifyWidgetResultsPage() {
  const sessionData = typeof window !== 'undefined' ? useSession() : { data: null, status: 'loading' };
  const { data: session, status } = sessionData;
  const [albumData, setAlbumData] = useState<any>(null);
  const [shopifyContext, setShopifyContext] = useState<{
    shop: string | null;
    customerId: string | null;
  }>({ shop: null, customerId: null });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load album data from sessionStorage
    const stored = sessionStorage.getItem('albumData');
    if (stored) {
      const data = JSON.parse(stored);
      setAlbumData(data);
      setShopifyContext(data.shopifyContext || { shop: null, customerId: null });
    } else {
      // No album data - redirect back to widget start
      router.push('/shopify/widget');
    }

    // Send height updates to parent iframe
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [router]);

  if (!albumData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Google login gate
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="shopify-widget-results">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            Your AI Love Album is Ready!
          </h1>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {albumData.analysis?.summary || 'Your Personalized Love Story Album'}
            </h2>
            <p className="text-gray-700 mb-6">
              We've analyzed your beautiful love story and created a unique 5-song album just for you.
              To continue and unlock your songs, please sign in with Google.
            </p>
          </div>

          <GoogleLoginGate />
        </div>
      </div>
    );
  }

  // User is authenticated - show payment gate
  if (!albumData.albumSessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: Album session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopify-widget-results">
      <PaymentGate
        albumSessionId={albumData.albumSessionId}
        onPaymentSuccess={() => {
          window.parent.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
        }}
      />
    </div>
  );
}
