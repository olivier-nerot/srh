import React, { useState } from "react";
import { CardElement } from "@stripe/react-stripe-js";

interface StripeCardInputProps {
  className?: string;
}

// Stable card element options to prevent re-renders
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      fontFamily: "Inter, system-ui, sans-serif",
      "::placeholder": {
        color: "#aab7c4",
      },
      iconColor: "#666EE8",
    },
    invalid: {
      color: "#9e2146",
      iconColor: "#FFC7EE",
    },
    complete: {
      color: "#4caf50",
      iconColor: "#4caf50",
    },
  },
  hidePostalCode: true,
  disableLink: true,
};

const StripeCardInput: React.FC<StripeCardInputProps> = React.memo(
  ({ className }) => {
    const [cardError, setCardError] = useState<string | null>(null);

    const handleCardChange = (event: { error?: { message: string } }) => {
      setCardError(event.error ? event.error.message : null);
    };

    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Informations de paiement
        </label>
        <div className="border border-gray-300 rounded-md p-4 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className="mt-2 text-sm text-red-600">{cardError}</div>
        )}
      </div>
    );
  },
);

StripeCardInput.displayName = "StripeCardInput";

export default StripeCardInput;
