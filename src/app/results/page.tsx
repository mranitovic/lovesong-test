'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SongPlayer from '../components/SongPlayer';
import LyricsPreview from '../components/LyricsPreview';
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

export default function ResultsPage() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [songGenerationStates, setSongGenerationStates] = useState<{[promptId: string]: SongGenerationState}>({});
  const [showLyricsPreview, setShowLyricsPreview] = useState(true); // Show lyrics preview first
  const [isRegeneratingLyrics, setIsRegeneratingLyrics] = useState(false);
  const router = useRouter();

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

    // Update session storage with the new lyrics
    sessionStorage.setItem('albumData', JSON.stringify(updatedAlbumData));

    // Hide lyrics preview and show song generation
    setShowLyricsPreview(false);
  };

  const handleLyricsRegeneration = async () => {
    if (!albumData || !albumData.storyAnswers) return;

    setIsRegeneratingLyrics(true);

    try {
      const firstSong = albumData.analysis.songs[0];

      // Call API to regenerate lyrics
      const response = await fetch('/api/regenerate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songPrompt: firstSong,
          coupleNames: albumData.storyAnswers.names,
          isFirstSong: true
        }),
      });

      const result: ApiResponse<{ lyrics: string }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to regenerate lyrics');
      }

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

      // Update session storage with the new lyrics
      sessionStorage.setItem('albumData', JSON.stringify(updatedAlbumData));
    } catch (error) {
      console.error('Error regenerating lyrics:', error);
      alert('Failed to regenerate lyrics. Please try again.');
    } finally {
      setIsRegeneratingLyrics(false);
    }
  };

  if (!albumData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
      </div>
    );
  }

  // COMMENTED OUT: Album title not needed without cover
  // const albumTitle = `${albumData.analysis.summary.split(' ').slice(0, 3).join(' ')} Album`;

  // Show lyrics preview if not approved yet
  if (showLyricsPreview && albumData.analysis.songs.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Love Story Album</h1>
            <p className="text-lg text-gray-600">
              Generated on {new Date(albumData.createdAt).toLocaleDateString()}
            </p>
          </div>

          <LyricsPreview
            song={albumData.analysis.songs[0]}
            onApprove={handleLyricsApproval}
            onRegenerate={handleLyricsRegeneration}
            isRegenerating={isRegeneratingLyrics}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Love Story Album</h1>
          <p className="text-lg text-gray-600">
            Generated on {new Date(albumData.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* COMMENTED OUT: Grid layout with album cover - now simplified */}
        {/* <div className="grid lg:grid-cols-3 gap-8"> */}
          {/* COMMENTED OUT: Album Cover section (cover generation disabled) */}
          {/* 
          <div className="lg:col-span-1">
            <AlbumCover cover={albumData.cover} albumTitle={albumTitle} />
          </div>
          */}
            
          {/* Story Summary - moved to full width */}
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Your Story</h3>
            <p className="text-gray-600 text-sm mb-4">{albumData.analysis.summary}</p>
            <div className="flex flex-wrap gap-2">
              {albumData.analysis.themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-pink-100 text-pink-800 text-xs rounded-full"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Songs - now full width */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Song Prompts</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Music generation is available for your first song only. You can view lyrics for all songs.
                </p>
                {getTotalGeneratedSongs() > 0 && (
                  <p className="text-pink-600 text-sm mt-1">
                    {getTotalGeneratedSongs()} songs generated so far
                  </p>
                )}
              </div>
              {getTotalGeneratedSongs() > 0 && (
                <button
                  onClick={downloadAll}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
                >
                  Download All ({getTotalGeneratedSongs()})
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
                  isGenerationAllowed={index === 0}
                />
              ))}
            </div>


            {/* Actions */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={createNewAlbum}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Create Another Album
              </button>
            </div>
          </div>
        {/* </div> COMMENTED OUT: End of grid layout */}
      </div>
    </div>
  );
}