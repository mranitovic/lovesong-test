'use client';

import { useState, useEffect } from 'react';
import QuestionStep from './QuestionStep';
import ProgressIndicator from './ProgressIndicator';
import { StoryAnswers, CoupleNames } from '@/types';

interface MultiStepStoryFormProps {
  onSubmit: (storyAnswers: StoryAnswers) => void;
  isLoading: boolean;
}

interface Question {
  id: keyof Omit<StoryAnswers, 'names'>;
  question: string;
  placeholder: string;
  type?: 'text' | 'textarea' | 'names';
}

const QUESTIONS: Array<Question | { id: 'names'; question: string; placeholder: string; type: 'names' } | { id: 'genres'; question: string; placeholder: string; type: 'genres' }> = [
  {
    id: 'names',
    question: "What are your names?",
    placeholder: "Tell us your first names",
    type: 'names'
  },
  {
    id: 'meeting',
    question: "How did you two first meet?",
    placeholder: "Share the story of your first encounter..."
  },
  {
    id: 'attraction',
    question: "What made you fall in love with them?",
    placeholder: "Describe what attracted you to each other..."
  },
  {
    id: 'memorable',
    question: "Describe your most memorable moment together",
    placeholder: "Tell us about a special moment that stands out..."
  },
  {
    id: 'challenges',
    question: "What challenges have you overcome together?",
    placeholder: "Share how you've grown stronger as a couple..."
  },
  {
    id: 'future',
    question: "How do you envision your future together?",
    placeholder: "Describe your dreams and aspirations..."
  },
  {
    id: 'genres',
    question: "What are your favorite music genres?",
    placeholder: "Choose your preferred music styles",
    type: 'genres'
  }
];

export default function MultiStepStoryForm({ onSubmit, isLoading }: MultiStepStoryFormProps) {
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
    const question = QUESTIONS[stepIndex - 1];
    const questionId = question.id;

    if (questionId === 'names') {
      const { person1, person2 } = answers.names;
      if (!person1.trim() || person1.trim().length < 2) {
        setErrors(prev => ({ ...prev, names: 'Please enter your name (at least 2 characters)' }));
        return false;
      }
      if (!person2.trim() || person2.trim().length < 2) {
        setErrors(prev => ({ ...prev, names: "Please enter your partner's name (at least 2 characters)" }));
        return false;
      }
    } else if (questionId === 'genres') {
      if (answers.genres.length === 0) {
        setErrors(prev => ({ ...prev, genres: 'Please select at least one music genre' }));
        return false;
      }
    } else {
      const value = answers[questionId as keyof Omit<StoryAnswers, 'names' | 'genres'>];
      if (!value.trim() || value.trim().length < 20) {
        setErrors(prev => ({ ...prev, [questionId]: 'Please provide more detail (at least 20 characters)' }));
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < QUESTIONS.length) {
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
    const question = QUESTIONS[currentStep - 1];
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
          <p className="text-lg text-gray-600">Creating your personalized album...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 relative overflow-hidden">
      <div className="absolute top-8 left-0 right-0 z-10">
        <ProgressIndicator currentStep={currentStep} totalSteps={QUESTIONS.length} />
      </div>

      {(() => {
        const question = QUESTIONS[currentStep - 1];
        const questionId = question.id;

        return (
          <QuestionStep
            key={questionId}
            question={question.question}
            placeholder={question.placeholder}
            value={getCurrentQuestionValue()}
            onChange={(value) => updateAnswer(questionId, value)}
            onContinue={handleContinue}
            onBack={currentStep > 1 ? handleBack : undefined}
            isFirst={currentStep === 1}
            isLast={currentStep === QUESTIONS.length}
            error={errors[questionId]}
            questionNumber={currentStep}
            totalQuestions={QUESTIONS.length}
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