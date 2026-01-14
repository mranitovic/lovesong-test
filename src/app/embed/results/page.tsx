'use client';

/**
 * Embed Results Page - For Shopify iframe integration
 *
 * This page displays the paid album and allows song generation
 * within the Shopify store iframe. It loads album data from the
 * database using the sessionId URL parameter.
 *
 * Flow:
 * 1. Customer completes payment
 * 2. Redirected to Shopify page with this iframe
 * 3. URL contains ?sessionId=xxx
 * 4. Load album from database
 * 5. Show song generation UI
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SongPlayer from '@/app/components/SongPlayer';
import PaymentGate from '@/app/components/PaymentGate';
import { StoryAnalysis, GeneratedSong, SongGenerationState } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Utility functions for localStorage persistence
const getAlbumStorageKey = (albumId: string) => `album_${albumId}_songs`;

const saveAlbumSongStates = (albumId: string, songStates: {[promptId: string]: SongGenerationState}) => {
  try {
    localStorage.setItem(getAlbumStorageKey(albumId), JSON.stringify(songStates));
  } catch (error) {
    console.error('Failed to save song states to localStorage:', error);
  }
};

const loadAlbumSongStates = (albumId: string): {[promptId: string]: SongGenerationState} => {
  try {
    const saved = localStorage.getItem(getAlbumStorageKey(albumId));
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load song states from localStorage:', error);
    return {};
  }
};

interface AlbumData {
  story: string;
  analysis: StoryAnalysis;
  createdAt: string;
  locale?: string;
}

interface PaymentStatus {
  hasPaid: boolean;
  albumSessionId: string | null;
}

export default function EmbedResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [songGenerationStates, setSongGenerationStates] = useState<{[promptId: string]: SongGenerationState}>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ hasPaid: false, albumSessionId: null });
  const [albumSessionId, setAlbumSessionId] = useState<string | null>(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [authenticationComplete, setAuthenticationComplete] = useState(false);

  // Send height updates to parent iframe
  useEffect(() => {
    const sendHeightUpdate = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    // Send initial height
    sendHeightUpdate();

    // Watch for content changes
    const observer = new ResizeObserver(sendHeightUpdate);
    observer.observe(document.body);

    // Send height periodically for dynamic content
    const interval = setInterval(sendHeightUpdate, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Load album data on mount
  useEffect(() => {
    console.log('🔍 [Embed Init] Component mounted, sessionId:', sessionId);

    if (!sessionId) {
      console.log('❌ [Embed Init] No sessionId in URL, redirecting');
      router.push('/embed');
      return;
    }

    // Load from database
    const loadPaidAlbum = async () => {
      console.log('📥 [Embed DB Load] Starting loadPaidAlbum for:', sessionId);
      setIsLoadingFromDb(true);
      try {
        const apiUrl = `/api/album/access-url?sessionId=${sessionId}`;
        console.log('📡 [Embed DB Load] Fetching:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('📡 [Embed DB Load] Response status:', response.status);
        const result = await response.json();
        console.log('📡 [Embed DB Load] Response data:', result);

        if (result.success && result.data) {
          console.log('✅ [Embed] Loaded paid album from database');
          console.log('📦 Album data:', result.data.albumData);
          console.log('💰 Has paid:', result.data.hasPaid);
          setAlbumData(result.data.albumData);
          setPaymentStatus({ hasPaid: result.data.hasPaid, albumSessionId: sessionId });
          setAlbumSessionId(sessionId);
          setAuthenticationComplete(true);

          // Load song states
          const albumId = result.data.albumData.createdAt;
          const savedSongStates = loadAlbumSongStates(albumId);
          setSongGenerationStates(savedSongStates);
          console.log('🎵 Loaded song states:', savedSongStates);
        } else {
          console.error('❌ [Embed] Failed to load paid album:', result.error);
          alert('Failed to load album. Please check your access link.');
          router.push('/embed');
        }
      } catch (error) {
        console.error('❌ [Embed] Error loading paid album:', error);
        alert('Error loading album.');
        router.push('/embed');
      } finally {
        setIsLoadingFromDb(false);
        console.log('🏁 [Embed DB Load] Finished loading');
      }
    };

    loadPaidAlbum();
  }, [router, sessionId]);

  const handleSongGenerate = async (promptId: string) => {
    if (!albumData || !albumSessionId) return;

    const prompt = albumData.analysis.songs.find((p) => p.id === promptId);
    if (!prompt) return;

    // Update state to generating
    const newState: SongGenerationState = {
      promptId: prompt.id,
      title: prompt.title,
      status: 'generating',
      songs: [],
    };
    const newStates = {
      ...songGenerationStates,
      [promptId]: newState
    };
    setSongGenerationStates(newStates);
    saveAlbumSongStates(albumData.createdAt, newStates);

    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          title: prompt.title,
          genre: prompt.genre,
          locale: albumData.locale || 'en',
          albumSessionId: albumSessionId,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const generatedSong: GeneratedSong = {
          id: result.data.id,
          title: prompt.title,
          audioUrl: result.data.audio_url,
          status: 'completed',
          lyrics: prompt.lyrics,
        };

        const completedState: SongGenerationState = {
          promptId: prompt.id,
          title: prompt.title,
          status: 'completed',
          songs: [generatedSong],
        };
        const updatedStates = {
          ...songGenerationStates,
          [promptId]: completedState
        };
        setSongGenerationStates(updatedStates);
        saveAlbumSongStates(albumData.createdAt, updatedStates);
      } else {
        throw new Error(result.error || 'Failed to generate song');
      }
    } catch (error) {
      console.error('Error generating song:', error);
      const errorState: SongGenerationState = {
        promptId: prompt.id,
        title: prompt.title,
        status: 'failed',
        songs: [],
        error: error instanceof Error ? error.message : 'Failed to generate song',
      };
      const errorStates = {
        ...songGenerationStates,
        [promptId]: errorState
      };
      setSongGenerationStates(errorStates);
      saveAlbumSongStates(albumData.createdAt, errorStates);
      alert('Failed to generate song. Please try again.');
    }
  };

  // Loading state
  if (isLoadingFromDb || !albumData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu álbum pago...</p>
        </div>
      </div>
    );
  }

  // Show payment gate if not paid yet
  if (!paymentStatus.hasPaid && albumSessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <PaymentGate
            albumSessionId={albumSessionId}
            onPaymentSuccess={() => {
              setPaymentStatus({ hasPaid: true, albumSessionId });
              window.parent.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Album Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
            {albumData.analysis.summary}
          </h1>
          <div className="mt-4">
            <span className="inline-block bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
              {albumData.analysis.mood}
            </span>
            {albumData.analysis.themes.map((theme, index) => (
              <span key={index} className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-2 mb-2">
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Song List */}
        <div className="space-y-6">
          {albumData.analysis.songs.map((prompt, index) => {
            const state = songGenerationStates[prompt.id];

            return (
              <SongPlayer
                key={prompt.id}
                songPrompt={prompt}
                index={index}
                generationState={state}
                onGenerationStateChange={(promptId, newState) => {
                  const newStates = {
                    ...songGenerationStates,
                    [promptId]: newState
                  };
                  setSongGenerationStates(newStates);
                  saveAlbumSongStates(albumData.createdAt, newStates);
                }}
                isGenerationAllowed={true}
                albumSessionId={albumSessionId || undefined}
              />
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>💾 Seu progresso é salvo automaticamente</p>
          <p>🎵 Cada música leva cerca de 1-2 minutos para gerar</p>
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
