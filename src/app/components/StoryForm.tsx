'use client';

import { useState } from 'react';
import { validateStory } from '@/lib/utils';

interface StoryFormProps {
  onSubmit: (story: string) => void;
  isLoading: boolean;
}

export default function StoryForm({ onSubmit, isLoading }: StoryFormProps) {
  const [story, setStory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateStory(story);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSubmit(story.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStory(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Love Story Album Generator
        </h1>
        <p className="text-lg text-gray-600">
          Tell us your love story and we'll create a 5-song professional album with AI
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-2">
            Your Love Story
          </label>
          <textarea
            id="story"
            value={story}
            onChange={handleChange}
            placeholder="Share your love story... How did you meet? What made you fall in love? What challenges did you overcome? Tell us about your journey together..."
            className={`w-full h-64 px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={5000}
          />
          <div className="flex justify-between mt-2">
            <div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {story.length}/5000 characters
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !story.trim()}
          className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Your Album...
            </div>
          ) : (
            'Generate My Album'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Each song will represent a different chapter of your love story.
          <br />
          The AI will also generate a custom album cover based on your story.
        </p>
      </div>
    </div>
  );
}