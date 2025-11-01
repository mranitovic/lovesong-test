'use client';

import { useState, useEffect } from 'react';
import MultiStepStoryForm from '@/app/components/MultiStepStoryForm';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { StoryAnalysis, StoryAnswers } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Embeddable Widget Page
 *
 * This page can be embedded in any Shopify store via iframe
 * without requiring a Shopify Partner account or App Proxy setup.
 *
 * Usage: <iframe src="https://your-domain.com/embed?shop=store.myshopify.com"></iframe>
 */

export const dynamic = 'force-dynamic';
export const runtime = 'edge';


export default function EmbedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; step: string } | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get shop domain from URL for tracking
  const shopDomain = searchParams.get('shop');

  useEffect(() => {
    // Send height updates to parent iframe
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    sendHeight();

    // Watch for content changes
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    // Also send height after a short delay to catch dynamic content
    const timer = setTimeout(sendHeight, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

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
    setProgress({ current: 1, total: 3, step: 'Analyzing your love story...' });

    try {
      const story = formatStoryFromAnswers(storyAnswers);

      // Step 1: Analyze the story
      const analysisResponse = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story,
          coupleNames: storyAnswers.names,
          genres: storyAnswers.genres,
          locale: 'en',
          shopDomain, // Track which shop this came from
        }),
      });

      const analysisResult: { success: boolean; data?: StoryAnalysis; error?: string } =
        await analysisResponse.json();

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Failed to analyze story');
      }

      const storyAnalysis = analysisResult.data;

      setProgress({ current: 2, total: 2, step: 'Saving your album...' });

      // Step 2: Create/save album session
      const albumData = {
        title: `${storyAnswers.names.person1} & ${storyAnswers.names.person2}'s Love Story`,
        artist: `${storyAnswers.names.person1} & ${storyAnswers.names.person2}`,
        story,
        storyAnswers,
        analysis: storyAnalysis,
        songs: [],
        createdAt: new Date().toISOString(),
      };

      const sessionResponse = await fetch('/api/user/album-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumData }),
      });

      const sessionResult = await sessionResponse.json();

      if (!sessionResult.success || !sessionResult.data) {
        throw new Error(sessionResult.error || 'Failed to save album session');
      }

      const { albumSessionId, userId } = sessionResult.data;

      setProgress({ current: 3, total: 3, step: 'Creating your checkout...' });

      // Step 3: Create Shopify checkout
      const checkoutResponse = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumSessionId,
          userId,
        }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResult.success || !checkoutResult.data?.checkoutUrl) {
        throw new Error(checkoutResult.error || 'Failed to create checkout');
      }

      // Redirect to Shopify checkout (either in iframe parent or current window)
      if (window.parent !== window) {
        // We're in an iframe - redirect parent window
        window.parent.location.href = checkoutResult.data.checkoutUrl;
      } else {
        // Direct access - redirect current window
        window.location.href = checkoutResult.data.checkoutUrl;
      }

    } catch (error) {
      console.error('Error analyzing story:', error);
      alert('An error occurred while analyzing your story. Please try again.');
      setIsLoading(false);
      setProgress(undefined);
    }
  };

  if (isLoading) {
    return <LoadingSpinner progress={progress} />;
  }

  return (
    <div className="embed-container p-4">
      {/* Optional: Show shop branding if provided */}
      {process.env.NODE_ENV === 'development' && shopDomain && (
        <div className="mb-4 text-xs text-gray-500">
          Embedded for: {shopDomain}
        </div>
      )}

      <MultiStepStoryForm onSubmit={handleStorySubmit} isLoading={isLoading} />

      <style jsx global>{`
        body {
          background: transparent;
          margin: 0;
          padding: 0;
        }

        /* Ensure good iframe integration */
        .embed-container {
          max-width: 100%;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
