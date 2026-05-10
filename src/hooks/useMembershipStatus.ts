import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

interface MembershipStatus {
  isValidMember: boolean;
  isLoading: boolean;
  membershipEndDate: Date | null;
}

export function useMembershipStatus(): MembershipStatus {
  const { user, isAuthenticated } = useAuthStore();
  const [isValidMember, setIsValidMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipEndDate, setMembershipEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      setIsValidMember(false);
      setIsLoading(false);
      return;
    }

    const checkMembership = async () => {
      try {
        // 1. Check subscribedUntil from database
        const profileRes = await fetch(
          `/api/user-management?action=profile&id=${encodeURIComponent(user.id)}`,
        );
        const profileData = await profileRes.json();

        if (profileData.success && profileData.user?.subscribedUntil) {
          const endDate = new Date(profileData.user.subscribedUntil);
          if (endDate > new Date()) {
            setIsValidMember(true);
            setMembershipEndDate(endDate);
            setIsLoading(false);
            return;
          }
        }

        // 2. Check active Stripe subscription
        const subRes = await fetch(
          `/api/stripe?action=get-subscriptions&email=${encodeURIComponent(user.email)}`,
        );
        const subData = await subRes.json();

        if (subData.subscriptions?.length > 0) {
          const activeSub = subData.subscriptions.find(
            (s: { status: string; cancel_at_period_end?: boolean }) =>
              (s.status === "active" || s.status === "trialing") &&
              !s.cancel_at_period_end,
          );
          if (activeSub) {
            setIsValidMember(true);
            setMembershipEndDate(new Date(activeSub.current_period_end * 1000));
            setIsLoading(false);
            return;
          }
        }

        // 3. Check last successful payment (one-time)
        // Convention metier : adhesion valide jusqu'au 31 decembre de l'annee du paiement
        const payRes = await fetch(
          `/api/stripe?action=get-payments&email=${encodeURIComponent(user.email)}`,
        );
        const payData = await payRes.json();

        if (payData.success && payData.lastPayment?.status === "succeeded") {
          const paymentYear = new Date(
            payData.lastPayment.created,
          ).getFullYear();
          const endOfYear = new Date(paymentYear, 11, 31, 23, 59, 59, 999);
          if (endOfYear > new Date()) {
            setIsValidMember(true);
            setMembershipEndDate(endOfYear);
            setIsLoading(false);
            return;
          }
        }

        setIsValidMember(false);
      } catch (error) {
        console.error("Error checking membership:", error);
        setIsValidMember(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, [isAuthenticated, user?.id, user?.email]);

  return { isValidMember, isLoading, membershipEndDate };
}
