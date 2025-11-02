'use client';

import { useState } from 'react';
// import { useSession } from 'next-auth/react';

interface PaymentGateProps {
  albumSessionId: string;
  onPaymentSuccess: () => void;
}

export default function PaymentGate({ albumSessionId }: PaymentGateProps) {
  // const { data: session } = useSession();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    // MODIFIED: Remove authentication check for iframe compatibility
    // Payment can proceed without authentication
    // if (!session?.user?.id) {
    //   setError('Você precisa estar autenticado');
    //   return;
    // }

    setIsCreatingCheckout(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumSessionId,
          userId: 'anonymous-user', // Use anonymous user for iframe compatibility
        }),
      });

      const data = await response.json();

      if (data.success && data.data.checkoutUrl) {
        // Redirect to Shopify checkout in the same window
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Falha ao criar checkout');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Erro ao criar checkout. Tente novamente.');
      setIsCreatingCheckout(false);
    }
  };

  if (isCreatingCheckout) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Preparando Checkout...
          </h3>
          <p className="text-gray-600">
            Você será redirecionado para finalizar a compra em instantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-xl p-8 border border-pink-200 max-w-md mx-auto">
      <div className="text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-2-5a2 2 0 01-4 0V9a2 2 0 014 0v1z" />
          </svg>
        </div>

        {/* Heading */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Gere Sua Música Personalizada
        </h3>
        <p className="text-gray-600 mb-6">
          Complete o pagamento para gerar sua música exclusiva por apenas:
        </p>

        {/* Price */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-pink-600 mb-2">
            R$ 100,00
          </div>
          <p className="text-sm text-gray-500">
            Pagamento único • Acesso vitalício
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              <strong>1 música completamente personalizada</strong> baseada na sua história
            </span>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              <strong>Download em alta qualidade</strong> (MP3)
            </span>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              <strong>Letra personalizada</strong> com os nomes do casal
            </span>
          </div>

          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">
              <strong>Acesso vitalício</strong> à sua música
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handleBuyNow}
          disabled={isCreatingCheckout}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Comprar Agora</span>
        </button>

        {/* Payment Methods */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Formas de pagamento disponíveis:</p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-6 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">PIX</div>
              <span className="text-xs text-gray-600">Instantâneo</span>
            </div>
            <div className="text-gray-300">•</div>
            <span className="text-xs text-gray-600">Cartão de Crédito</span>
            <div className="text-gray-300">•</div>
            <span className="text-xs text-gray-600">Boleto</span>
          </div>
        </div>

        {/* Info about payment */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            💡 Após completar o pagamento no checkout seguro do Shopify, volte para esta página. Sua música será gerada automaticamente!
          </p>
        </div>
      </div>
    </div>
  );
}
