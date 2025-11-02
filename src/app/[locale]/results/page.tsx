'use client';

/**
 * AUTHENTICATION BYPASS FOR IFRAME COMPATIBILITY
 *
 * Google OAuth does not work in iframes due to:
 * - Third-party cookie restrictions in modern browsers
 * - X-Frame-Options security policies
 * - OAuth callback URL issues in iframe contexts
 *
 * The authentication and payment gates have been temporarily disabled
 * to allow the app to work when embedded in Shopify stores.
 *
 * TODO: Restore authentication when implementing a native Shopify app
 * or when using a custom authentication flow that supports iframes.
 */

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
// import { useSession } from 'next-auth/react';
import SongPlayer from '../../components/SongPlayer';
import LyricsPreview from '../../components/LyricsPreview';
// import GoogleLoginGate from '../../components/GoogleLoginGate';
import PaymentGate from '../../components/PaymentGate';
import { StoryAnalysis, GeneratedSong, SongGenerationState, StoryAnswers, CoupleNames, ApiResponse } from '@/types';

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
  storyAnswers?: StoryAnswers;
  analysis: StoryAnalysis;
  createdAt: string;
  locale?: string;
}

interface PaymentStatus {
  hasPaid: boolean;
  albumSessionId: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const locale = params.locale as string;
  // const { data: session, status: sessionStatus } = useSession();
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [songGenerationStates, setSongGenerationStates] = useState<{[promptId: string]: SongGenerationState}>({});
  const [showLyricsPreview, setShowLyricsPreview] = useState(true);
  const [isRegeneratingLyrics, setIsRegeneratingLyrics] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ hasPaid: false, albumSessionId: null });
  const [albumSessionId, setAlbumSessionId] = useState<string | null>(null);
  const [authenticationComplete, setAuthenticationComplete] = useState(false);
  const [firstSongGenerated, setFirstSongGenerated] = useState(false);
  const router = useRouter();

  // Load album data from sessionStorage on mount
  useEffect(() => {
    const data = sessionStorage.getItem('albumData');
    if (!data) {
      router.push('/');
      return;
    }

    try {
      const parsedData: AlbumData = JSON.parse(data);
      setAlbumData(parsedData);

      // Load song generation states from localStorage using album createdAt as ID
      const albumId = parsedData.createdAt;
      const savedSongStates = loadAlbumSongStates(albumId);
      setSongGenerationStates(savedSongStates);

      console.log(`Loaded ${Object.keys(savedSongStates).length} song states from localStorage for album ${albumId}`);
    } catch (error) {
      console.error('Failed to parse album data:', error);
      router.push('/');
    }
  }, [router]);

  // Send iframe height updates to parent (for Shopify embed)
  useEffect(() => {
    const sendHeightUpdate = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    // Send initial height
    sendHeightUpdate();

    // Send height updates when content changes
    const observer = new ResizeObserver(sendHeightUpdate);
    observer.observe(document.body);

    // Also send on window resize
    window.addEventListener('resize', sendHeightUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeightUpdate);
    };
  }, [albumData, showLyricsPreview, songGenerationStates]);

  // COMMENTED OUT: Authentication handling (OAuth doesn't work in iframes)
  // useEffect(() => {
  //   if (sessionStatus === 'authenticated' && session?.user && albumData && !authenticationComplete) {
  //     handleUserAuthenticated();
  //   }
  // }, [sessionStatus, session, albumData, authenticationComplete]);

  // COMMENTED OUT: Payment status SSE stream
  // useEffect(() => {
  //   if (!authenticationComplete || paymentStatus.hasPaid) return;
  //
  //   console.log('🔌 Connecting to payment status stream...');
  //
  //   const eventSource = new EventSource('/api/payment/stream');
  //
  //   eventSource.addEventListener('connected', (e) => {
  //     console.log('✅ Connected to payment stream');
  //   });
  //
  //   eventSource.addEventListener('payment_status', (e) => {
  //     const data = JSON.parse((e as MessageEvent).data);
  //     console.log('💳 Payment status update:', data);
  //
  //     if (data.data) {
  //       setPaymentStatus({
  //         hasPaid: data.data.hasPaid,
  //         albumSessionId: data.data.albumSessionId
  //       });
  //
  //       if (data.data.hasPaid) {
  //         console.log('✅ Payment confirmed via SSE!');
  //       }
  //     }
  //   });
  //
  //   eventSource.addEventListener('payment_complete', (e) => {
  //     console.log('🎉 Payment complete!');
  //     eventSource.close();
  //   });
  //
  //   eventSource.addEventListener('error', (e) => {
  //     console.error('❌ SSE error:', e);
  //     eventSource.close();
  //   });
  //
  //   eventSource.addEventListener('timeout', (e) => {
  //     console.log('⏱️  SSE timeout');
  //     eventSource.close();
  //   });
  //
  //   return () => {
  //     console.log('🔌 Closing payment stream connection');
  //     eventSource.close();
  //   };
  // }, [authenticationComplete, paymentStatus.hasPaid]);

  // REMOVED: Auto-authentication no longer sets session ID
  // Album session is created when user approves lyrics (handleLyricsApproval)
  // This ensures we have a real database ID for payment, not a fake temp ID

  // COMMENTED OUT: Original authentication handler
  // const handleUserAuthenticated = async () => {
  //   if (!albumData || authenticationComplete) return;
  //
  //   try {
  //     // Create album session in database
  //     const response = await fetch('/api/user/album-session', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ albumData })
  //     });
  //
  //     const result = await response.json();
  //
  //     if (result.success) {
  //       setAlbumSessionId(result.data.albumSessionId);
  //       setAuthenticationComplete(true);
  //
  //       // Check payment status immediately after authentication
  //       await checkPaymentStatus();
  //     }
  //   } catch (error) {
  //     console.error('Error creating album session:', error);
  //   }
  // };

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/payment/status');
      const result = await response.json();

      if (result.success) {
        setPaymentStatus({
          hasPaid: result.data.hasPaid,
          albumSessionId: result.data.albumSessionId
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const generateSong = () => {
    // RESTORED: Payment check - song generation only after payment
    if (!albumData || !paymentStatus.hasPaid) return;

    // Start song generation after payment
    const song = albumData.analysis.songs[0];
    if (song) {
      const newState: SongGenerationState = {
        promptId: song.id,
        title: song.title,
        status: 'not_generated',
        songs: []
      };

      handleGenerationStateChange(song.id, newState);
      setFirstSongGenerated(true);
    }
  };

  const handleGenerationStateChange = (promptId: string, state: SongGenerationState) => {
    setSongGenerationStates(prev => {
      const newStates = {
        ...prev,
        [promptId]: state
      };

      // Save to localStorage
      if (albumData) {
        const albumId = albumData.createdAt;
        saveAlbumSongStates(albumId, newStates);
        console.log(`Saved song state to localStorage for album ${albumId}, prompt ${promptId}: ${state.status}`);
      }

      return newStates;
    });
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus({ hasPaid: true, albumSessionId });
    setShowLyricsPreview(false);
    // Automatically start song generation after payment
    setTimeout(() => {
      generateSong();
    }, 1000);
  };

  const createNewSong = () => {
    // Clean up localStorage for current album
    if (albumData) {
      const albumId = albumData.createdAt;
      localStorage.removeItem(getAlbumStorageKey(albumId));
      console.log(`Cleared localStorage for album ${albumId}`);
    }

    sessionStorage.removeItem('albumData');
    router.push('/');
  };


  const handleLyricsApproval = async (approvedLyrics: string) => {
    if (!albumData) return;

    // Update the first song's lyrics
    const updatedSongs = [...albumData.analysis.songs];
    updatedSongs[0] = {
      ...updatedSongs[0],
      lyrics: approvedLyrics
    };

    const updatedAlbumData = {
      ...albumData,
      analysis: {
        ...albumData.analysis,
        songs: updatedSongs
      }
    };

    setAlbumData(updatedAlbumData);

    // Update sessionStorage
    sessionStorage.setItem('albumData', JSON.stringify(updatedAlbumData));

    // Create anonymous album session in database for payment
    try {
      const response = await fetch('/api/album-session/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumData: updatedAlbumData })
      });

      const result = await response.json();

      if (result.success && result.data.albumSessionId) {
        // Store the real album session ID from database
        setAlbumSessionId(result.data.albumSessionId);
        setAuthenticationComplete(true);
        console.log('✅ Anonymous album session created:', result.data.albumSessionId);
      } else {
        console.error('Failed to create album session:', result.error);
        alert('Erro ao preparar pagamento. Tente novamente.');
        return;
      }
    } catch (error) {
      console.error('Error creating album session:', error);
      alert('Erro ao preparar pagamento. Tente novamente.');
      return;
    }

    setShowLyricsPreview(false);
  };

  const regenerateLyrics = async () => {
    if (!albumData) return;

    setIsRegeneratingLyrics(true);
    try {
      const firstSong = albumData.analysis.songs[0];
      const coupleNames: CoupleNames = albumData.storyAnswers?.names || { person1: '', person2: '' };

      const response = await fetch('/api/regenerate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songPrompt: firstSong,
          coupleNames,
          isFirstSong: true,
          locale: albumData.locale || locale // Use stored locale or current locale
        }),
      });

      const result: ApiResponse<{ lyrics: string }> = await response.json();

      if (result.success && result.data) {
        // Update the first song's lyrics
        const updatedSongs = [...albumData.analysis.songs];
        updatedSongs[0] = {
          ...updatedSongs[0],
          lyrics: result.data.lyrics
        };

        const updatedAlbumData = {
          ...albumData,
          analysis: {
            ...albumData.analysis,
            songs: updatedSongs
          }
        };

        setAlbumData(updatedAlbumData);
        sessionStorage.setItem('albumData', JSON.stringify(updatedAlbumData));
      } else {
        throw new Error(result.error || 'Failed to regenerate lyrics');
      }
    } catch (error) {
      console.error('Error regenerating lyrics:', error);
      alert('Erro ao regenerar letras. Tente novamente.');
    } finally {
      setIsRegeneratingLyrics(false);
    }
  };

  // COMMENTED OUT: Authentication loading and login gate (OAuth doesn't work in iframes)
  // if (sessionStatus === 'loading') {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
  //         <p className="text-gray-600">Carregando...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // COMMENTED OUT: Login gate for unauthenticated users
  // if (sessionStatus === 'unauthenticated') {
  //   return <GoogleLoginGate onLoginSuccess={() => {}} />;
  // }

  // COMMENTED OUT: Loading while setting up user session
  // if (!authenticationComplete && albumData) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
  //         <p className="text-gray-600">Preparando sua música...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!albumData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Música não encontrada</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Criar Nova Música
          </button>
        </div>
      </div>
    );
  }

  const isGenerationAllowed = (): boolean => {
    return paymentStatus.hasPaid; // Song generation only allowed after payment
  };

  const shouldShowPaymentGate = authenticationComplete && !paymentStatus.hasPaid && !showLyricsPreview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sua Música Personalizada</h1>
          <p className="text-gray-600">
            {albumData.analysis.summary}
          </p>
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

        {/* Lyrics Preview */}
        {showLyricsPreview && albumData.analysis.songs[0] && (
          <LyricsPreview
            song={albumData.analysis.songs[0]}
            onApprove={handleLyricsApproval}
            onRegenerate={regenerateLyrics}
            isRegenerating={isRegeneratingLyrics}
          />
        )}

        {/* Payment Gate - shown after lyrics approval, before song generation */}
        {shouldShowPaymentGate && albumSessionId && (
          <div className="mb-8 flex justify-center">
            <PaymentGate
              albumSessionId={albumSessionId}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {/* Song */}
        {!showLyricsPreview && albumData.analysis.songs[0] && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Sua Música</h2>
              <p className="text-gray-600 text-sm text-center">
                {paymentStatus.hasPaid
                  ? "Sua música está sendo gerada. Isso pode levar alguns minutos."
                  : "Complete o pagamento para gerar sua música personalizada."
                }
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SongPlayer
                key={albumData.analysis.songs[0].id}
                songPrompt={albumData.analysis.songs[0]}
                index={0}
                generationState={songGenerationStates[albumData.analysis.songs[0].id]}
                onGenerationStateChange={handleGenerationStateChange}
                isGenerationAllowed={isGenerationAllowed()}
              />
            </div>

            {/* Actions */}
            <div className="mt-12 text-center space-y-4">
              <button
                onClick={createNewSong}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Criar Nova Música
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}