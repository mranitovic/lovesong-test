'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SongPlayer from '../components/SongPlayer';
import LyricsPreview from '../components/LyricsPreview';
import GoogleLoginGate from '../components/GoogleLoginGate';
import PaymentGate from '../components/PaymentGate';
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
}

interface PaymentStatus {
  hasPaid: boolean;
  albumSessionId: string | null;
}

export default function ResultsPage() {
  const { data: session, status: sessionStatus } = useSession();
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

  // Handle authentication and album session creation
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user && albumData && !authenticationComplete) {
      handleUserAuthenticated();
    }
  }, [sessionStatus, session, albumData, authenticationComplete]);

  // Check payment status for authenticated users
  useEffect(() => {
    if (authenticationComplete && albumSessionId) {
      checkPaymentStatus();
    }
  }, [authenticationComplete, albumSessionId]);

  // Poll payment status every 10 seconds to check for payments completed on Shopify
  useEffect(() => {
    if (!authenticationComplete || paymentStatus.hasPaid) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [authenticationComplete, paymentStatus.hasPaid]);

  const handleUserAuthenticated = async () => {
    if (!albumData || authenticationComplete) return;

    try {
      // Create album session in database
      const response = await fetch('/api/user/album-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumData })
      });

      const result = await response.json();

      if (result.success) {
        setAlbumSessionId(result.data.albumSessionId);
        setAuthenticationComplete(true);

        // Check if they already have payment for this session
        await checkPaymentStatus();

        // Generate first song automatically after authentication
        if (!firstSongGenerated) {
          setTimeout(() => {
            generateFirstSong();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error creating album session:', error);
    }
  };

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

  const generateFirstSong = () => {
    if (!albumData || firstSongGenerated) return;

    // Automatically start generation for the first song
    const firstSong = albumData.analysis.songs[0];
    if (firstSong) {
      const newState: SongGenerationState = {
        promptId: firstSong.id,
        title: firstSong.title,
        status: 'not_generated',
        songs: []
      };

      handleGenerationStateChange(firstSong.id, newState);
      setFirstSongGenerated(true);
      setShowLyricsPreview(false); // Hide lyrics preview after generating first song
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
    checkPaymentStatus(); // Refresh payment status
  };

  const createNewAlbum = () => {
    // Clean up localStorage for current album
    if (albumData) {
      const albumId = albumData.createdAt;
      localStorage.removeItem(getAlbumStorageKey(albumId));
      console.log(`Cleared localStorage for album ${albumId}`);
    }

    sessionStorage.removeItem('albumData');
    router.push('/');
  };

  const downloadAll = () => {
    if (!albumData) return;

    // Download all generated songs
    Object.values(songGenerationStates).forEach((state) => {
      if (state.status === 'completed') {
        state.songs.forEach((song) => {
          const link = document.createElement('a');
          link.href = song.audioUrl;
          link.download = `${song.title}${song.version ? ` - Version ${song.version}` : ''}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }
    });
  };

  const getTotalGeneratedSongs = () => {
    return Object.values(songGenerationStates)
      .filter(state => state.status === 'completed')
      .reduce((total, state) => total + state.songs.length, 0);
  };

  const handleLyricsApproval = (approvedLyrics: string) => {
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
          isFirstSong: true
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

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login gate if not authenticated
  if (sessionStatus === 'unauthenticated') {
    return <GoogleLoginGate onLoginSuccess={() => {}} />;
  }

  // Show loading while setting up user session
  if (!authenticationComplete && albumData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando seu álbum...</p>
        </div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Álbum não encontrado</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Criar Novo Álbum
          </button>
        </div>
      </div>
    );
  }

  const isGenerationAllowed = (index: number): boolean => {
    if (index === 0) return true; // First song always allowed after authentication
    return paymentStatus.hasPaid; // Other songs only allowed after payment
  };

  const shouldShowPaymentGate = authenticationComplete && !paymentStatus.hasPaid && (firstSongGenerated || !showLyricsPreview);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Seu Álbum Personalizado</h1>
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

        {/* Payment Gate */}
        {shouldShowPaymentGate && albumSessionId && (
          <div className="mb-8 flex justify-center">
            <PaymentGate
              albumSessionId={albumSessionId}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {/* Songs */}
        {!showLyricsPreview && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Suas Músicas</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {paymentStatus.hasPaid
                    ? "Você tem acesso a todas as 5 músicas do seu álbum."
                    : "Primeira música liberada. Adquira o álbum completo para acessar as outras 4 músicas."
                  }
                </p>
                {getTotalGeneratedSongs() > 0 && (
                  <p className="text-pink-600 text-sm mt-1">
                    {getTotalGeneratedSongs()} músicas geradas
                  </p>
                )}
              </div>
              {getTotalGeneratedSongs() > 0 && (
                <button
                  onClick={downloadAll}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                >
                  Download Todas ({getTotalGeneratedSongs()})
                </button>
              )}
            </div>

            <div className="space-y-4">
              {albumData.analysis.songs.map((songPrompt, index) => (
                <SongPlayer
                  key={songPrompt.id}
                  songPrompt={songPrompt}
                  index={index}
                  generationState={songGenerationStates[songPrompt.id]}
                  onGenerationStateChange={handleGenerationStateChange}
                  isGenerationAllowed={isGenerationAllowed(index)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-12 text-center space-y-4">
              <button
                onClick={createNewAlbum}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Criar Novo Álbum
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}