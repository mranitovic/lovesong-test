'use client';

import { useState, useEffect } from 'react';
import GenreStep from './GenreStep';

interface QuestionStepProps {
  question: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  error?: string;
  questionNumber: number;
  totalQuestions: number;
  type?: 'text' | 'textarea' | 'names' | 'genres';
  nameLabels?: { person1: string; person2: string };
}

export default function QuestionStep({
  question,
  placeholder,
  value,
  onChange,
  onContinue,
  onBack,
  isFirst = false,
  isLast = false,
  error,
  questionNumber,
  totalQuestions,
  type = 'textarea',
  nameLabels = { person1: 'Your name', person2: "Your partner's name" }
}: QuestionStepProps) {
  const [localValue, setLocalValue] = useState(value);
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (type === 'names' && value) {
      try {
        const names = JSON.parse(value);
        setPerson1(names.person1 || '');
        setPerson2(names.person2 || '');
      } catch {
        setPerson1('');
        setPerson2('');
      }
    } else if (type === 'genres') {
      try {
        const genreArray = JSON.parse(value || '[]');
        setGenres(Array.isArray(genreArray) ? genreArray : []);
      } catch {
        setGenres([]);
      }
    } else {
      setLocalValue(value);
    }
  }, [value, type]);

  const handleLocalChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleNameChange = (person: 'person1' | 'person2', newValue: string) => {
    const updatedNames = {
      person1: person === 'person1' ? newValue : person1,
      person2: person === 'person2' ? newValue : person2
    };

    if (person === 'person1') {
      setPerson1(newValue);
    } else {
      setPerson2(newValue);
    }

    onChange(JSON.stringify(updatedNames));
  };

  const handleGenreChange = (newGenres: string[]) => {
    setGenres(newGenres);
    onChange(JSON.stringify(newGenres));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canContinue()) {
        onContinue();
      }
    }
  };

  const canContinue = () => {
    if (type === 'names') {
      return person1.trim().length >= 2 && person2.trim().length >= 2;
    }
    if (type === 'genres') {
      return genres.length > 0;
    }
    return localValue.trim().length >= 20;
  };

  const getCharacterCount = () => {
    if (type === 'names') {
      return `${person1.length + person2.length}/100`;
    }
    return `${localValue.length}/1000`;
  };

  if (type === 'genres') {
    return (
      <GenreStep
        question={question}
        value={genres}
        onChange={handleGenreChange}
        onContinue={onContinue}
        onBack={onBack}
        isFirst={isFirst}
        isLast={isLast}
        error={error}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 mb-2">
            Question {questionNumber} of {totalQuestions}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {question}
          </h2>
        </div>

        <div className="space-y-6">
          {type === 'names' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {nameLabels.person1}
                </label>
                <input
                  type="text"
                  value={person1}
                  onChange={(e) => handleNameChange('person1', e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter your first name"
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                    error ? 'border-red-500' : isFocused ? 'border-pink-300' : 'border-gray-300'
                  }`}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {nameLabels.person2}
                </label>
                <input
                  type="text"
                  value={person2}
                  onChange={(e) => handleNameChange('person2', e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter your partner's first name"
                  className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                    error ? 'border-red-500' : isFocused ? 'border-pink-300' : 'border-gray-300'
                  }`}
                  maxLength={50}
                />
              </div>
            </div>
          ) : type === 'text' ? (
            <input
              type="text"
              value={localValue}
              onChange={(e) => handleLocalChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                error ? 'border-red-500' : isFocused ? 'border-pink-300' : 'border-gray-300'
              }`}
              maxLength={1000}
            />
          ) : (
            <textarea
              value={localValue}
              onChange={(e) => handleLocalChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full h-32 px-4 py-3 text-lg border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ${
                error ? 'border-red-500' : isFocused ? 'border-pink-300' : 'border-gray-300'
              }`}
              maxLength={1000}
            />
          )}

          <div className="flex justify-between items-center">
            <div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {getCharacterCount()}
            </p>
          </div>

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
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          Press Enter to continue
        </div>
      </div>
    </div>
  );
}