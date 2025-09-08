import React, { useState, useEffect } from 'react';
import { CardElement, useElements } from '@stripe/react-stripe-js';

interface StripeCardInputProps {
  className?: string;
}

// Stable card element options to prevent re-renders
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#666EE8',
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#FFC7EE',
    },
    complete: {
      color: '#4caf50',
      iconColor: '#4caf50',
    },
  },
  hidePostalCode: true,
};

const StripeCardInput: React.FC<StripeCardInputProps> = React.memo(({ className }) => {
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const elements = useElements();

  const handleCardChange = (event: any) => {
    console.log('=== DEBUG: Card change event ===', {
      error: event.error,
      complete: event.complete,
      empty: event.empty,
      brand: event.brand
    });
    setCardError(event.error ? event.error.message : null);
  };

  const handleCardReady = () => {
    console.log('=== DEBUG: CardElement is ready ===');
    setCardReady(true);
  };

  // Debug elements availability
  useEffect(() => {
    if (elements) {
      const cardElement = elements.getElement(CardElement);
      console.log('=== DEBUG: CardElement in component ===', !!cardElement);
    }
  }, [elements]);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Informations de paiement
      </label>
      <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={handleCardChange}
          onReady={handleCardReady}
        />
      </div>
      {cardError && (
        <div className="mt-2 text-sm text-red-600">
          {cardError}
        </div>
      )}
      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500">
        Card ready: {cardReady ? '✅' : '❌'}
      </div>
    </div>
  );
});

StripeCardInput.displayName = 'StripeCardInput';

export default StripeCardInput;