export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function validateStory(story: string): string | null {
  if (!story.trim()) {
    return 'Please enter your love story';
  }

  if (story.trim().length < 50) {
    return 'Please provide a more detailed story (at least 50 characters)';
  }

  if (story.trim().length > 5000) {
    return 'Story is too long (maximum 5000 characters)';
  }

  return null;
}

export function validateNames(person1: string, person2: string): string | null {
  if (!person1.trim() || person1.trim().length < 2) {
    return 'Please enter your name (at least 2 characters)';
  }

  if (!person2.trim() || person2.trim().length < 2) {
    return "Please enter your partner's name (at least 2 characters)";
  }

  if (person1.trim().length > 50) {
    return 'Your name is too long (maximum 50 characters)';
  }

  if (person2.trim().length > 50) {
    return "Your partner's name is too long (maximum 50 characters)";
  }

  return null;
}

export function validateStoryAnswer(answer: string, minLength: number = 20): string | null {
  if (!answer.trim()) {
    return 'Please provide an answer';
  }

  if (answer.trim().length < minLength) {
    return `Please provide more detail (at least ${minLength} characters)`;
  }

  if (answer.trim().length > 1000) {
    return 'Answer is too long (maximum 1000 characters)';
  }

  return null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}