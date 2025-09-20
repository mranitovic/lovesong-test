'use client';

interface LoadingSpinnerProps {
  message?: string;
  progress?: {
    current: number;
    total: number;
    step: string;
  };
}

export default function LoadingSpinner({ message, progress }: LoadingSpinnerProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-6"></div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Creating Your Album
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message || 'Please wait while we generate your personalized love story album...'}
        </p>

        {progress && (
          <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.step}</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>This process may take a few minutes...</p>
          <ul className="mt-2 space-y-1">
            <li>✓ Analyzing your love story</li>
            <li>✓ Generating 5 unique songs</li>
            {/* COMMENTED OUT: Album cover creation disabled */}
            {/* <li>✓ Creating album cover artwork</li> */}
          </ul>
        </div>
      </div>
    </div>
  );
}