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
          Criando Sua Música
        </h2>

        <p className="text-gray-600 mb-6">
          {message || 'Aguarde enquanto geramos sua música personalizada...'}
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
          <p>Esse processo pode levar alguns minutos...</p>
          <ul className="mt-2 space-y-1">
            <li>✓ Analisando sua história de amor</li>
            <li>✓ Gerando sua música única</li>
          </ul>
        </div>
      </div>
    </div>
  );
}