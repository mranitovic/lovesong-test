'use client';

import { useState, useRef, useEffect } from 'react';
import { GeneratedSong, SongPrompt, ApiResponse, TaskStartResponse, TaskPollResponse, SongGenerationState } from '@/types';

interface SongPlayerProps {
  songPrompt: SongPrompt;
  index: number;
  generationState?: SongGenerationState;
  onGenerationStateChange?: (promptId: string, state: SongGenerationState) => void;
  isGenerationAllowed?: boolean;
}

export default function SongPlayer({ songPrompt, index, generationState, onGenerationStateChange, isGenerationAllowed = true }: SongPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [currentTime, setCurrentTime] = useState<{[key: string]: number}>({});
  const [duration, setDuration] = useState<{[key: string]: number}>({});
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derive state from generationState prop
  const isGenerating = generationState?.status === 'generating';
  const generationError = generationState?.status === 'failed' ? generationState.error : null;
  const generatedSongs = generationState?.songs || [];

  const generateSong = async () => {
    if (!onGenerationStateChange) return;

    try {
      // Start generation and get taskId immediately
      const response = await fetch('/api/start-song-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songPrompt }),
      });

      const result: ApiResponse<TaskStartResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to start song generation');
      }

      const { taskId } = result.data;
      console.log(`Started generation for ${songPrompt.title} with taskId: ${taskId}`);

      // Update state to 'generating' with taskId
      const newState: SongGenerationState = {
        promptId: songPrompt.id,
        title: songPrompt.title,
        status: 'generating',
        songs: [],
        taskId,
        startedAt: Date.now(),
      };

      onGenerationStateChange(songPrompt.id, newState);

      // Start polling for this task
      startPolling(taskId);
    } catch (error) {
      console.error('Error starting song generation:', error);

      if (onGenerationStateChange) {
        const errorState: SongGenerationState = {
          promptId: songPrompt.id,
          title: songPrompt.title,
          status: 'failed',
          songs: [],
          error: error instanceof Error ? error.message : 'Failed to start song generation',
        };
        onGenerationStateChange(songPrompt.id, errorState);
      }
    }
  };

  // Polling methods
  const startPolling = (taskId: string) => {
    console.log(`Starting polling for taskId: ${taskId}`);
    stopPolling(); // Clear any existing polling

    // Poll immediately, then every 10 seconds
    pollTaskStatus(taskId);
    pollingIntervalRef.current = setInterval(() => {
      pollTaskStatus(taskId);
    }, 10000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    if (!onGenerationStateChange) return;

    try {
      const response = await fetch('/api/poll-song-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      const result: ApiResponse<TaskPollResponse> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to poll song status');
      }

      const pollResult = result.data;
      console.log(`Poll result for ${taskId}: ${pollResult.status}`);

      if (pollResult.status === 'completed' && pollResult.songs) {
        console.log(`Task ${taskId} completed with ${pollResult.songs.length} songs`);

        // Update state to completed with songs
        const completedState: SongGenerationState = {
          promptId: songPrompt.id,
          title: songPrompt.title,
          status: 'completed',
          songs: pollResult.songs,
          taskId,
          startedAt: generationState?.startedAt || Date.now(),
        };

        onGenerationStateChange(songPrompt.id, completedState);
        stopPolling();
      } else if (pollResult.status === 'failed') {
        console.log(`Task ${taskId} failed: ${pollResult.error}`);

        // Update state to failed
        const failedState: SongGenerationState = {
          promptId: songPrompt.id,
          title: songPrompt.title,
          status: 'failed',
          songs: [],
          taskId,
          startedAt: generationState?.startedAt || Date.now(),
          error: pollResult.error || 'Song generation failed',
        };

        onGenerationStateChange(songPrompt.id, failedState);
        stopPolling();
      }
      // If status is 'generating', continue polling
    } catch (error) {
      console.error(`Error polling task status for ${taskId}:`, error);
    }
  };

  // Resume polling on mount if we have a generating task
  useEffect(() => {
    if (generationState?.status === 'generating' && generationState.taskId) {
      console.log(`Resuming polling for taskId: ${generationState.taskId}`);
      startPolling(generationState.taskId);
    }

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [generationState?.status, generationState?.taskId]);

  const togglePlay = (songId: string) => {
    const audioRef = audioRefs.current[songId];
    if (!audioRef) return;

    // Pause all other audio elements
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== songId && audio && !audio.paused) {
        audio.pause();
        setIsPlaying(prev => ({ ...prev, [id]: false }));
      }
    });

    if (isPlaying[songId]) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(prev => ({ ...prev, [songId]: !prev[songId] }));
    setActiveVersion(songId);
  };

  const handleTimeUpdate = (songId: string) => {
    const audioRef = audioRefs.current[songId];
    if (!audioRef) return;
    setCurrentTime(prev => ({ ...prev, [songId]: audioRef.currentTime }));
  };

  const handleLoadedMetadata = (songId: string) => {
    const audioRef = audioRefs.current[songId];
    if (!audioRef) return;
    setDuration(prev => ({ ...prev, [songId]: audioRef.duration }));
  };

  const handleEnded = (songId: string) => {
    setIsPlaying(prev => ({ ...prev, [songId]: false }));
    setCurrentTime(prev => ({ ...prev, [songId]: 0 }));
  };

  const handleSeek = (songId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const audioRef = audioRefs.current[songId];
    if (!audioRef) return;
    const time = parseFloat(e.target.value);
    audioRef.currentTime = time;
    setCurrentTime(prev => ({ ...prev, [songId]: time }));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadSong = (song: GeneratedSong) => {
    const link = document.createElement('a');
    link.href = song.audioUrl;
    link.download = `${song.title}${song.version ? ` - Version ${song.version}` : ''}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatLyricsForDisplay = (lyrics: string) => {
    return lyrics.split('\n').map((line, index) => {
      const trimmedLine = line.trim();

      // Section headers (like [Verse 1], [Chorus], etc.)
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        return (
          <div key={index} className="text-sm font-bold text-pink-600 mt-3 mb-2 first:mt-0">
            {trimmedLine}
          </div>
        );
      }

      // Empty lines for spacing
      if (trimmedLine === '') {
        return <div key={index} className="h-1"></div>;
      }

      // Regular lyrics lines
      return (
        <div key={index} className="text-xs text-gray-700 leading-relaxed mb-0.5">
          {trimmedLine}
        </div>
      );
    });
  };

  const hasGeneratedSongs = generatedSongs && generatedSongs.length > 0;
  const hasNotStarted = !generationState || generationState.status === 'not_generated';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{songPrompt.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{songPrompt.description}</p>
          <div className="flex gap-2 mb-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{songPrompt.genre}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{songPrompt.mood}</span>
            {!isGenerationAllowed && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-2-5a2 2 0 01-4 0V9a2 2 0 014 0v1z" />
                </svg>
                Pagamento Necessário
              </span>
            )}
          </div>
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            {showLyrics ? 'Ocultar Letra' : 'Ver Letra'}
          </button>
        </div>

        {/* Generate/Status button */}
        {hasNotStarted && (
          <>
            {isGenerationAllowed ? (
              <button
                onClick={generateSong}
                disabled={isGenerating}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  'Gerar Música'
                )}
              </button>
            ) : (
              <div className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-2-5a2 2 0 01-4 0V9a2 2 0 014 0v1z" />
                </svg>
                <span className="text-gray-500 text-sm">Complete o pagamento para gerar sua música</span>
              </div>
            )}
          </>
        )}

        {/* Generation status display */}
        {isGenerating && (
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Gerando música... Isso pode levar alguns minutos
          </div>
        )}
      </div>

      {/* Error display */}
      {generationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{generationError}</p>
          <button
            onClick={generateSong}
            className="mt-2 text-red-600 text-sm underline hover:text-red-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Generated songs display */}
      {/* Lyrics Display */}
      {showLyrics && (
        <div className="mb-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h5 className="font-medium text-pink-800">Letra da Música</h5>
          </div>
          <div className="max-h-48 overflow-y-auto bg-white rounded p-3 border border-pink-100">
            {formatLyricsForDisplay(songPrompt.lyrics)}
          </div>
        </div>
      )}

      {hasGeneratedSongs && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-2">
            {generatedSongs!.length > 1 ? 'Múltiplas versões geradas:' : 'Música gerada:'}
          </div>

          {generatedSongs!.map((song) => (
            <div key={song.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {song.version ? `Versão ${song.version}` : song.title}
                </h4>
                <button
                  onClick={() => downloadSong(song)}
                  className="text-gray-500 hover:text-pink-600 transition-colors"
                  title="Baixar música"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>

              <audio
                ref={(el) => { audioRefs.current[song.id] = el; }}
                src={song.audioUrl}
                onTimeUpdate={() => handleTimeUpdate(song.id)}
                onLoadedMetadata={() => handleLoadedMetadata(song.id)}
                onEnded={() => handleEnded(song.id)}
                preload="metadata"
              />

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => togglePlay(song.id)}
                  className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                >
                  {isPlaying[song.id] ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={duration[song.id] || 0}
                    value={currentTime[song.id] || 0}
                    onChange={(e) => handleSeek(song.id, e)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${((currentTime[song.id] || 0) / (duration[song.id] || 1)) * 100}%, #e5e7eb ${((currentTime[song.id] || 0) / (duration[song.id] || 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime[song.id] || 0)}</span>
                    <span>{formatTime(duration[song.id] || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Lyrics Display */}
              {song.lyrics && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h5 className="font-medium text-gray-900">Letra</h5>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto">
                    {song.lyrics}
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      )}
    </div>
  );
}