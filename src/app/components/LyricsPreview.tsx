'use client';

import { useState } from 'react';
import { SongPrompt } from '@/types';

interface LyricsPreviewProps {
  song: SongPrompt;
  onApprove: (approvedLyrics: string) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function LyricsPreview({
  song,
  onApprove,
  onRegenerate,
  isRegenerating = false
}: LyricsPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics);

  const handleApprove = () => {
    onApprove(editedLyrics);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedLyrics(song.lyrics);
    setIsEditing(false);
  };

  const formatLyricsForDisplay = (lyrics: string) => {
    return lyrics.split('\n').map((line, index) => {
      const trimmedLine = line.trim();

      // Section headers (like [Verse 1], [Chorus], etc.)
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        return (
          <div key={index} className="text-lg font-bold text-pink-600 mt-6 mb-3 first:mt-0">
            {trimmedLine}
          </div>
        );
      }

      // Empty lines for spacing
      if (trimmedLine === '') {
        return <div key={index} className="h-2"></div>;
      }

      // Regular lyrics lines
      return (
        <div key={index} className="text-gray-800 leading-relaxed mb-1">
          {trimmedLine}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-sm text-pink-600 font-medium mb-2">PRÉVIA DA SUA MÚSICA</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{song.title}</h2>
        <p className="text-gray-600">
          {song.genre} • {song.mood}
        </p>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
          {song.description}
        </p>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Letra Gerada</h3>
          <p className="text-sm text-gray-600">
            Revise a letra da sua música. Você pode editá-la ou gerar uma nova.
          </p>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editedLyrics}
              onChange={(e) => setEditedLyrics(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Edit your lyrics here..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="lyrics-display">
            <div className="bg-white rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
              <div className="text-center font-mono text-sm leading-relaxed">
                {formatLyricsForDisplay(editedLyrics)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        {!isEditing && (
          <>
            <button
              onClick={handleEdit}
              className="w-full sm:w-auto px-6 py-3 border border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 font-medium transition-colors"
            >
              Editar Letra
            </button>

            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  Gerando Nova Letra...
                </div>
              ) : (
                'Gerar Nova Letra'
              )}
            </button>

            <button
              onClick={handleApprove}
              className="w-full sm:w-auto px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium transition-colors transform hover:scale-105"
            >
              Aprovar Letra
            </button>
          </>
        )}
      </div>

      <div className="text-center mt-6 text-sm text-gray-500">
        Após aprovar, você poderá prosseguir para o pagamento e gerar sua música
      </div>
    </div>
  );
}