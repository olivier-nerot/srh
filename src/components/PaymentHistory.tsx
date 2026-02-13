import React from "react";
import { History } from "lucide-react";
import type { Payment } from "../services/paymentService";

interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  loading = false,
}) => {
  const formatDate = (dateInput: string | number | Date) => {
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return "Date invalide";
    } catch {
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Historique des paiements
          </span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-srh-blue" />
          <span className="ml-2 text-sm text-gray-500">Chargement...</span>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          Historique des paiements
        </span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {payments.map((payment) => {
          const isSuccess = payment.status === "succeeded";
          const isCanceled = payment.status === "canceled";
          const statusLabel = isSuccess
            ? null
            : isCanceled
              ? "Abandonné"
              : "Échec";
          const borderClass = isSuccess
            ? "border-gray-100"
            : isCanceled
              ? "border-orange-200 bg-orange-50"
              : "border-red-200 bg-red-50";
          const textClass = isSuccess
            ? "text-green-600"
            : isCanceled
              ? "text-orange-600"
              : "text-red-600";

          return (
            <div
              key={payment.id}
              className={`py-1.5 px-2 bg-white rounded border ${borderClass}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {formatDate(payment.created)}
                </span>
                <span className={`text-sm font-semibold ${textClass}`}>
                  {payment.amount} €
                  {statusLabel && (
                    <span className="ml-1 text-xs font-normal">
                      ({statusLabel})
                    </span>
                  )}
                </span>
              </div>
              {!isSuccess && payment.failure_message && (
                <p className={`text-xs mt-1 ${textClass}`}>
                  {payment.failure_message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentHistory;
