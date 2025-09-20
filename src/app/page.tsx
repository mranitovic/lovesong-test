'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MultiStepStoryForm from './components/MultiStepStoryForm';
import LoadingSpinner from './components/LoadingSpinner';
import { StoryAnalysis, AlbumCover, ApiResponse, StoryAnswers } from '@/types';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; step: string } | undefined>();
  const router = useRouter();

  // Helper function to format structured answers into a narrative story
  const formatStoryFromAnswers = (storyAnswers: StoryAnswers): string => {
    const { names, meeting, attraction, memorable, challenges, future, genres } = storyAnswers;

    return `This is the love story of ${names.person1} and ${names.person2}.

How they met: ${meeting}

What made them fall in love: ${attraction}

Their most memorable moment: ${memorable}

Challenges they've overcome: ${challenges}

Their future together: ${future}

Favorite music genres: ${genres.join(', ')}`;
  };

  const handleStorySubmit = async (storyAnswers: StoryAnswers) => {
    setIsLoading(true);
    setProgress({ current: 1, total: 1, step: 'Analyzing your love story...' });

    try {
      // Convert structured answers to narrative format for existing API
      const story = formatStoryFromAnswers(storyAnswers);

      // Only analyze the story - no music generation
      const analysisResponse = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story,
          coupleNames: storyAnswers.names,
          genres: storyAnswers.genres
        }),
      });

      const analysisResult: ApiResponse<StoryAnalysis> = await analysisResponse.json();

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Failed to analyze story');
      }

      const storyAnalysis = analysisResult.data;

      // Store results with both formatted story and structured answers
      const albumData = {
        story,
        storyAnswers,
        analysis: storyAnalysis,
        createdAt: new Date().toISOString(),
      };

      sessionStorage.setItem('albumData', JSON.stringify(albumData));

      // Clear the saved form data after successful submission
      localStorage.removeItem('storyAnswers');

      router.push('/results');

    } catch (error) {
      console.error('Error analyzing story:', error);
      alert('An error occurred while analyzing your story. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(undefined);
    }
  };

  if (isLoading) {
    return <LoadingSpinner progress={progress} />;
  }

  return <MultiStepStoryForm onSubmit={handleStorySubmit} isLoading={isLoading} />;
}