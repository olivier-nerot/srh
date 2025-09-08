import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

interface StripeCardInputProps {
  className?: string;
}

const StripeCardInput: React.FC<StripeCardInputProps> = React.memo(({ className }) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Informations de paiement
      </label>
      <div className="border border-gray-300 rounded-md p-3 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
    </div>
  );
});

StripeCardInput.displayName = 'StripeCardInput';

export default StripeCardInput;