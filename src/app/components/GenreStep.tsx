'use client';

import { useState, useEffect } from 'react';
import {
  Music,
  Mic,
  Guitar,
  Headphones,
  Piano,
  Music2,
  Heart,
  Mountain,
  Disc3,
  Zap
} from 'lucide-react';

interface GenreStepProps {
  question: string;
  value: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  error?: string;
  questionNumber: number;
  totalQuestions: number;
}

interface Genre {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const GENRES: Genre[] = [
  {
    id: 'rock',
    name: 'Rock',
    icon: <Guitar className="w-8 h-8" />,
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'pop',
    name: 'Pop',
    icon: <Mic className="w-8 h-8" />,
    color: 'from-pink-500 to-purple-500'
  },
  {
    id: 'jazz',
    name: 'Jazz',
    icon: <Piano className="w-8 h-8" />,
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'electronic',
    name: 'Electronic',
    icon: <Headphones className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'country',
    name: 'Country',
    icon: <Mountain className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'classical',
    name: 'Classical',
    icon: <Music2 className="w-8 h-8" />,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'rnb',
    name: 'R&B',
    icon: <Heart className="w-8 h-8" />,
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'indie',
    name: 'Indie',
    icon: <Disc3 className="w-8 h-8" />,
    color: 'from-teal-500 to-green-500'
  },
  {
    id: 'folk',
    name: 'Folk',
    icon: <Music className="w-8 h-8" />,
    color: 'from-stone-500 to-amber-500'
  },
  {
    id: 'hip-hop',
    name: 'Hip-Hop',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-purple-500 to-violet-500'
  }
];

export default function GenreStep({
  question,
  value,
  onChange,
  onContinue,
  onBack,
  isFirst = false,
  isLast = false,
  error,
  questionNumber,
  totalQuestions
}: GenreStepProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(value);

  useEffect(() => {
    setSelectedGenres(value);
  }, [value]);

  const handleGenreToggle = (genreId: string) => {
    const newSelectedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter(id => id !== genreId)
      : [...selectedGenres, genreId];

    setSelectedGenres(newSelectedGenres);
    onChange(newSelectedGenres);
  };

  const canContinue = () => {
    return selectedGenres.length > 0;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">
            Question {questionNumber} of {totalQuestions}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {question}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Select your favorite music genres to personalize your album
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => handleGenreToggle(genre.id)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? 'border-pink-500 bg-gradient-to-br ' + genre.color + ' text-white shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {genre.icon}
                  </div>
                  <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {genre.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedGenres.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Selected: {selectedGenres.map(id => GENRES.find(g => g.id === id)?.name).join(', ')}
            </p>
          </div>
        )}

        {error && (
          <div className="text-center mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div>
            {!isFirst && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                ← Back
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue()}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
              canContinue()
                ? 'bg-pink-600 text-white hover:bg-pink-700 transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLast ? 'Create My Album' : 'Continue →'}
          </button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          Select at least one genre to continue
        </div>
      </div>
    </div>
  );
}