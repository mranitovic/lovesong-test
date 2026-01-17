'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MultiStepStoryForm from '@/app/components/MultiStepStoryForm';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { StoryAnalysis, StoryAnswers } from '@/types';

/**
 * Shopify Storefront Widget Page
 *
 * This page is loaded within an iframe on the Shopify storefront via app proxy.
 * It provides the AI Love Album Generator experience embedded in the merchant's store.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'edge';


export default function ShopifyWidgetPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [shopifyContext, setShopifyContext] = useState<{
    shop: string | null;
    customerId: string | null;
  }>({ shop: null, customerId: null });
  const [progress, setProgress] = useState<{ current: number; total: number; step: string } | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract Shopify context from URL parameters
    const shop = searchParams.get('shop');
    const customerId = searchParams.get('customer_id');

    setShopifyContext({ shop, customerId });

    // Send initial height to parent for iframe sizing
    sendHeightToParent();

    // Setup resize observer to keep iframe height updated
    const resizeObserver = new ResizeObserver(() => {
      sendHeightToParent();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, [searchParams]);

  const sendHeightToParent = () => {
    const height = document.body.scrollHeight;
    window.parent.postMessage(
      { type: 'resize', height },
      '*' // In production, specify the exact parent origin
    );
  };

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

      // Only analyze the story - no music generation yet
      const analysisResponse = await fetch('/api/analyze-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story,
          coupleNames: storyAnswers.names,
          genres: storyAnswers.genres,
          locale: 'en', // Default to English for Shopify widget
          shopifyContext: shopifyContext, // Include Shopify context
        }),
      });

      const analysisResult: { success: boolean; data?: StoryAnalysis; error?: string } =
        await analysisResponse.json();

      if (!analysisResult.success || !analysisResult.data) {
        throw new Error(analysisResult.error || 'Failed to analyze story');
      }

      const storyAnalysis = analysisResult.data;

      // Store results with Shopify context
      const albumData = {
        story,
        storyAnswers,
        analysis: storyAnalysis,
        createdAt: new Date().toISOString(),
        locale: 'en',
        shopifyContext, // Store Shopify shop and customer info
      };

      sessionStorage.setItem('albumData', JSON.stringify(albumData));

      // Clear saved form data
      localStorage.removeItem('storyAnswers');

      // Navigate to results page within the widget
      router.push('/shopify/widget/results');
    } catch (error) {
      console.error('Error analyzing story:', error);
      alert('An error occurred while analyzing your story. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(undefined);
      sendHeightToParent();
    }
  };

  if (isLoading) {
    return <LoadingSpinner progress={progress} />;
  }

  return (
    <div className="shopify-widget-container">
      {/* Shopify context indicator (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && shopifyContext.shop && (
        <div className="mb-4 p-2 bg-blue-50 text-blue-800 text-xs rounded">
          Shop: {shopifyContext.shop}
          {shopifyContext.customerId && ` | Customer: ${shopifyContext.customerId}`}
        </div>
      )}

      <MultiStepStoryForm onSubmit={handleStorySubmit} isLoading={isLoading} />

      <style jsx>{`
        .shopify-widget-container {
          width: 100%;
          max-width: 100%;
          padding: 0;
        }

        /* Ensure widget looks good in Shopify theme context */
        :global(body) {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
