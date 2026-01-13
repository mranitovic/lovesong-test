'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import MultiStepStoryForm from '../components/MultiStepStoryForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { StoryAnalysis, AlbumCover, ApiResponse, StoryAnswers } from '@/types';
import { MetaPixelEvents } from '@/lib/tracking';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; step: string } | undefined>();
  const [hasStarted, setHasStarted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(1);

  // Capture cart token from URL on mount (Shopify redirect flow)
  useEffect(() => {
    const cartToken = searchParams.get('cart_token');

    if (cartToken) {
      // Store cart token in sessionStorage for use during checkout
      sessionStorage.setItem('shopify_cart_token', cartToken);
      console.log('[Cart Token] Stored cart token from Shopify:', cartToken);
    }
  }, [searchParams]);

  // Track page view on mount
  useEffect(() => {
    MetaPixelEvents.songCreationPageView(1);

    // Setup idle abandonment tracking (3 minutes)
    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Only track abandonment if user has started the form
      if (hasStarted && !isLoading) {
        idleTimerRef.current = setTimeout(() => {
          MetaPixelEvents.songCreationAbandoned(currentStepRef.current, 'idle');
        }, 3 * 60 * 1000); // 3 minutes
      }
    };

    // Listen to user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    // Cleanup
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [hasStarted, isLoading]);

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
    // Track song inputs completed
    MetaPixelEvents.songInputsCompleted();

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
          genres: storyAnswers.genres,
          locale: locale // Pass the current locale for multilingual generation
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
        locale: locale, // Store the current locale
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

  const handleFormStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      MetaPixelEvents.songCreationStarted('Shopify');
    }
  };

  const handleStepChange = (step: number) => {
    currentStepRef.current = step;
  };

  if (isLoading) {
    return <LoadingSpinner progress={progress} />;
  }

  return (
    <MultiStepStoryForm
      onSubmit={handleStorySubmit}
      isLoading={isLoading}
      onStart={handleFormStart}
      onStepChange={handleStepChange}
    />
  );
}