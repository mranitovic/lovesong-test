'use client';

/**
 * Embed Thank You Page - Post-payment success page for Shopify iframe
 *
 * This page is shown immediately after a customer completes payment
 * on Shopify. It displays a success message and provides a clear CTA
 * to access their purchased songs.
 *
 * Flow:
 * 1. Customer completes Shopify checkout
 * 2. Shopify redirects to: /pages/thank-you on their store
 * 3. That page embeds this iframe with ?sessionId=xxx
 * 4. Customer sees success message
 * 5. Customer clicks "Access Your Songs"
 * 6. Navigates to /embed/results?sessionId=xxx
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Music, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface AlbumDetails {
  coupleNames?: string;
  albumTitle?: string;
  songCount?: number;
}

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Send height updates to parent iframe
  useEffect(() => {
    const sendHeightUpdate = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    sendHeightUpdate();

    const observer = new ResizeObserver(sendHeightUpdate);
    observer.observe(document.body);

    const interval = setInterval(sendHeightUpdate, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Load album details
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const loadAlbumDetails = async () => {
      try {
        const response = await fetch(`/api/album/access-url?sessionId=${sessionId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const albumData = result.data.albumData;
          setAlbumDetails({
            coupleNames: albumData.analysis?.summary || 'Your Love Story',
            albumTitle: albumData.analysis?.albumDescription || 'Personalized AI Love Album',
            songCount: albumData.analysis?.songPrompts?.length || 5,
          });
        }
      } catch (error) {
        console.error('Error loading album details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbumDetails();
  }, [sessionId]);

  const handleAccessSongs = () => {
    if (sessionId) {
      router.push(`/embed/results?sessionId=${sessionId}`);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">❌ No session ID provided</p>
          <p className="text-gray-600 text-sm">Please check your payment confirmation email for the correct link.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-bounce">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
            🎉 Pagamento Confirmado!
          </h1>

          <p className="text-xl text-gray-700 mb-2">
            Seu álbum de amor personalizado está pronto!
          </p>
        </div>

        {/* Album Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-pink-100">
          {albumDetails && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  {albumDetails.coupleNames}
                </h2>
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>

              <p className="text-gray-600 mb-4">
                {albumDetails.albumTitle}
              </p>

              <div className="flex items-center justify-center gap-2 text-pink-600 font-semibold">
                <Music className="w-5 h-5" />
                <span>{albumDetails.songCount} Músicas Personalizadas</span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">✨ O que você ganhou:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Acesso a todas as {albumDetails?.songCount || 5} músicas personalizadas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Download em alta qualidade (MP3)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Acesso vitalício ao seu álbum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Letras personalizadas baseadas na sua história</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleAccessSongs}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3 text-lg"
          >
            <Music className="w-6 h-6" />
            🎧 Acessar Minhas Músicas
          </button>
        </div>

        {/* Email Notice */}
        <div className="text-center text-sm text-gray-600 bg-white/50 rounded-lg p-4">
          <p className="mb-1">
            📧 <strong>Você também receberá um email</strong> com o link de acesso
          </p>
          <p className="text-xs">
            Você pode voltar a qualquer momento para ouvir suas músicas!
          </p>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: transparent;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
