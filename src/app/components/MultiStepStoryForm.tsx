'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import QuestionStep from './QuestionStep';
import ProgressIndicator from './ProgressIndicator';
import { StoryAnswers, CoupleNames } from '@/types';

interface MultiStepStoryFormProps {
  onSubmit: (storyAnswers: StoryAnswers) => void;
  isLoading: boolean;
}

interface Question {
  id: keyof StoryAnswers;
  type?: 'text' | 'textarea' | 'names' | 'genres';
}

const QUESTION_IDS: Question[] = [
  { id: 'names', type: 'names' },
  { id: 'meeting', type: 'textarea' },
  { id: 'attraction', type: 'textarea' },
  { id: 'memorable', type: 'textarea' },
  { id: 'challenges', type: 'textarea' },
  { id: 'future', type: 'textarea' },
  { id: 'genres', type: 'genres' }
];

export default function MultiStepStoryForm({ onSubmit, isLoading }: MultiStepStoryFormProps) {
  const t = useTranslations('form');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<StoryAnswers>({
    names: { person1: '', person2: '' },
    meeting: '',
    attraction: '',
    memorable: '',
    challenges: '',
    future: '',
    genres: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved answers from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem('storyAnswers');
    if (savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        setAnswers(parsedAnswers);
      } catch (error) {
        console.error('Error loading saved answers:', error);
      }
    }
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyAnswers', JSON.stringify(answers));
  }, [answers]);

  const updateAnswer = (questionId: string, value: string) => {
    if (questionId === 'names') {
      try {
        const names: CoupleNames = JSON.parse(value);
        setAnswers(prev => ({ ...prev, names }));
      } catch {
        // Handle invalid JSON for names
      }
    } else if (questionId === 'genres') {
      try {
        const genres: string[] = JSON.parse(value);
        setAnswers(prev => ({ ...prev, genres }));
      } catch {
        // Handle invalid JSON for genres
      }
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }

    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const question = QUESTION_IDS[stepIndex - 1];
    const questionId = question.id;

    if (questionId === 'names') {
      const { person1, person2 } = answers.names;
      if (!person1.trim() || person1.trim().length < 2) {
        setErrors(prev => ({ ...prev, names: tErrors('nameMinLength') }));
        return false;
      }
      if (!person2.trim() || person2.trim().length < 2) {
        setErrors(prev => ({ ...prev, names: tErrors('partnerNameMinLength') }));
        return false;
      }
    } else if (questionId === 'genres') {
      if (answers.genres.length === 0) {
        setErrors(prev => ({ ...prev, genres: tErrors('genreRequired') }));
        return false;
      }
    } else {
      const value = answers[questionId as keyof Omit<StoryAnswers, 'names' | 'genres'>];
      if (!value.trim() || value.trim().length < 20) {
        setErrors(prev => ({ ...prev, [questionId]: tErrors('detailMinLength') }));
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < QUESTION_IDS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - submit the form
      onSubmit(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getCurrentQuestionValue = (): string => {
    const question = QUESTION_IDS[currentStep - 1];
    if (question.id === 'names') {
      return JSON.stringify(answers.names);
    }
    if (question.id === 'genres') {
      return JSON.stringify(answers.genres);
    }
    return answers[question.id as keyof Omit<StoryAnswers, 'names' | 'genres'>];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 relative overflow-hidden">
      <div className="absolute top-8 left-0 right-0 z-10">
        <ProgressIndicator currentStep={currentStep} totalSteps={QUESTION_IDS.length} />
      </div>

      {(() => {
        const question = QUESTION_IDS[currentStep - 1];
        const questionId = question.id;

        // Helper to safely get placeholder - some questions like 'names' don't have a single placeholder
        const getPlaceholder = () => {
          try {
            return t(`${questionId}.placeholder`);
          } catch {
            return '';
          }
        };

        return (
          <QuestionStep
            key={questionId}
            question={t(`${questionId}.question`)}
            placeholder={getPlaceholder()}
            value={getCurrentQuestionValue()}
            onChange={(value) => updateAnswer(questionId, value)}
            onContinue={handleContinue}
            onBack={currentStep > 1 ? handleBack : undefined}
            isFirst={currentStep === 1}
            isLast={currentStep === QUESTION_IDS.length}
            error={errors[questionId]}
            questionNumber={currentStep}
            totalQuestions={QUESTION_IDS.length}
            type={question.type || 'textarea'}
          />
        );
      })()}

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </div>
  );
}