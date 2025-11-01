'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaymentGate from '@/app/components/PaymentGate';
import GoogleLoginGate from '@/app/components/GoogleLoginGate';
import { useSession } from 'next-auth/react';

/**
 * Embed Results Page
 *
 * Shows payment gate for embedded widget
 */

export const dynamic = 'force-dynamic';
export const runtime = 'edge';


export default function EmbedResultsPage() {
  const sessionData = typeof window !== 'undefined' ? useSession() : { data: null, status: 'loading' };
  const { data: session, status } = sessionData;
  const [albumData, setAlbumData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Load album data from sessionStorage
    const stored = sessionStorage.getItem('albumData');
    if (stored) {
      setAlbumData(JSON.parse(stored));
    } else {
      // No album data - redirect back to start
      router.push('/embed');
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
      <div className="embed-results p-6">
        <div className="max-w-4xl mx-auto">
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
          <button
            onClick={() => router.push('/embed')}
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="embed-results p-6">
      <PaymentGate
        albumSessionId={albumData.albumSessionId}
        onPaymentSuccess={() => {
          // Redirect to success page or show success message
          window.parent.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
        }}
      />
    </div>
  );
}
