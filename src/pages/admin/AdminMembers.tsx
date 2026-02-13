import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Mail,
  Building2,
  MapPin,
  Calendar,
  Settings,
  Search,
  Filter,
  Briefcase,
  CreditCard,
  Trash2,
  Download,
  RefreshCw,
  Send,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { getAllUsers, deleteUser } from "../../services/userService";
import {
  getUserLastPayment,
  getUserSubscriptions,
  type Payment,
  type Subscription,
} from "../../services/paymentService";

interface User {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  hospital?: string | null;
  address?: string | null;
  subscription?: string | null;
  infopro?: string | null;
  isadmin: boolean | null;
  newsletter: boolean | null;
  subscribedUntil?: Date | null;
  created_at: string | null;
  updated_at: string | null;
  lastPayment?: Payment | null;
  firstPayment?: Payment | null;
  activeSubscription?: Subscription | null;
}

const AdminMembers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    user: User | null;
  }>({
    show: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Email templates based on payment status filter
  const emailTemplates: Record<string, { subject: string; body: string }> = {
    all: {
      subject: "Information importante - Syndicat des Radiologues Hospitaliers",
      body: `Nous souhaitons vous informer des dernières actualités du Syndicat des Radiologues Hospitaliers.

Connectez-vous à votre espace membre pour consulter les dernières informations et mettre à jour vos préférences si nécessaire.

Nous restons à votre disposition pour toute question.`,
    },
    valid: {
      subject: "Merci pour votre adhésion - SRH",
      body: `Nous vous remercions pour votre adhésion au Syndicat des Radiologues Hospitaliers.

Votre adhésion est à jour et vous permet de bénéficier de tous les avantages réservés aux membres.

N'hésitez pas à consulter votre espace membre pour accéder à nos ressources et actualités.`,
    },
    expired: {
      subject: "Renouvellement de votre adhésion SRH",
      body: `Votre adhésion au Syndicat des Radiologues Hospitaliers a expiré.

Pour continuer à bénéficier des avantages réservés aux membres (accès aux ressources, représentation professionnelle, actualités), nous vous invitons à renouveler votre adhésion.

Connectez-vous à votre espace membre pour procéder au renouvellement en quelques clics.`,
    },
    failed: {
      subject: "Action requise - Échec de votre paiement SRH",
      body: `Votre dernier paiement d'adhésion au Syndicat des Radiologues Hospitaliers n'a pas pu être traité.

Cela peut être dû à une carte expirée, un solde insuffisant ou un problème temporaire avec votre banque.

Nous vous invitons à mettre à jour votre moyen de paiement en vous connectant à votre espace membre. Une fois votre carte mise à jour, votre paiement sera automatiquement relancé.`,
    },
    "no-payment": {
      subject: "Finalisez votre adhésion au SRH",
      body: `Nous avons remarqué que votre inscription au Syndicat des Radiologues Hospitaliers n'est pas encore finalisée.

Pour bénéficier de tous les avantages réservés aux membres, nous vous invitons à compléter votre adhésion en vous connectant à votre espace membre.

N'hésitez pas à nous contacter si vous rencontrez des difficultés.`,
    },
    recurring: {
      subject: "Information sur votre abonnement SRH",
      body: `Votre adhésion au Syndicat des Radiologues Hospitaliers est configurée en paiement récurrent.

Votre prochain paiement sera automatiquement prélevé à la date d'échéance. Vous pouvez consulter les détails dans votre espace membre.

Si vous souhaitez modifier vos préférences de paiement, connectez-vous à votre espace membre.`,
    },
    "one-time": {
      subject: "Rappel - Renouvellement de votre adhésion SRH",
      body: `Votre adhésion au Syndicat des Radiologues Hospitaliers a été réglée par paiement unique.

N'oubliez pas de renouveler votre adhésion avant la date d'expiration pour continuer à bénéficier de tous les avantages réservés aux membres.

Vous pouvez également opter pour le paiement récurrent dans votre espace membre pour ne plus avoir à vous soucier du renouvellement.`,
    },
  };

  const getEmailTemplate = (filter: string) => {
    return emailTemplates[filter] || emailTemplates.all;
  };

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(emailTemplates.all.subject);
  const [emailBody, setEmailBody] = useState(emailTemplates.all.body);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message: string;
    details?: { sent: number; failed: number };
  } | null>(null);

  // Cleanup duplicates state
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [duplicatesList, setDuplicatesList] = useState<
    Array<{
      email: string;
      name: string | null;
      count: number;
      toKeep: {
        id: string;
        created: string;
        amount: number;
        hasPaymentMethod: boolean;
      };
      toCancel: Array<{ id: string; created: string; amount: number }>;
    }>
  >([]);
  const [duplicatesSummary, setDuplicatesSummary] = useState<{
    membersWithDuplicates: number;
    subscriptionsToCancel: number;
  } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean;
    message: string;
    details?: { cancelled: number; errors: number };
  } | null>(null);

  // Guard against multiple payment loading calls
  const isLoadingPaymentsRef = useRef(false);
  const hasLoadedPaymentsRef = useRef(false);

  // Cache key for sessionStorage - include Stripe mode to separate test/live data
  const isTestMode = import.meta.env.VITE_STRIPE_TESTMODE === "true";
  const PAYMENT_CACHE_KEY = `srh_admin_payments_cache_${isTestMode ? "test" : "live"}`;

  const getCachedPayments = (): Record<
    string,
    {
      lastPayment: Payment | null;
      firstPayment: Payment | null;
      activeSubscription: Subscription | null;
    }
  > | null => {
    try {
      const cached = sessionStorage.getItem(PAYMENT_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const setCachedPayments = (
    data: Record<
      string,
      {
        lastPayment: Payment | null;
        firstPayment: Payment | null;
        activeSubscription: Subscription | null;
      }
    >,
  ) => {
    try {
      sessionStorage.setItem(PAYMENT_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to cache payments:", e);
    }
  };

  const clearCacheAndRefresh = () => {
    sessionStorage.removeItem(PAYMENT_CACHE_KEY);
    hasLoadedPaymentsRef.current = false;
    isLoadingPaymentsRef.current = false;
    // Reload users which will trigger fresh payment loading
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        // Check for cached payment data
        const cachedPayments = getCachedPayments();

        if (cachedPayments) {
          // Use cached data - apply it immediately
          const usersWithCachedPayments = result.users.map((user: User) => {
            const cached = cachedPayments[user.email];
            return {
              ...user,
              lastPayment: cached?.lastPayment || null,
              firstPayment: cached?.firstPayment || null,
              activeSubscription: cached?.activeSubscription || null,
            };
          });
          setUsers(usersWithCachedPayments);
          setLoading(false);
          hasLoadedPaymentsRef.current = true;
          console.log(
            "Using cached payment data for",
            Object.keys(cachedPayments).length,
            "users",
          );
        } else {
          // No cache - set users without payment data and load in background
          const usersWithoutPayments = result.users.map((user: User) => ({
            ...user,
            lastPayment: null,
            firstPayment: null,
          }));
          setUsers(usersWithoutPayments);
          setLoading(false);

          // Start background payment loading
          loadPaymentsInBackground(result.users);
        }
      } else {
        setError(result.error || "Erreur lors du chargement des membres");
        setLoading(false);
      }
    } catch {
      setError("Erreur lors du chargement des membres");
      setLoading(false);
    }
  };

  const loadPaymentsInBackground = async (userList: User[]) => {
    // Guard: prevent multiple simultaneous calls
    if (isLoadingPaymentsRef.current || hasLoadedPaymentsRef.current) {
      console.log(
        "Payment loading already in progress or completed, skipping...",
      );
      return;
    }

    isLoadingPaymentsRef.current = true;
    setLoadingPayments(true);
    setLoadingProgress({ current: 0, total: userList.length });

    const batchSize = 5; // Process 5 users at a time
    const delay = 200; // 200ms delay between batches

    for (let i = 0; i < userList.length; i += batchSize) {
      const batch = userList.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (user: User) => {
          try {
            // Fetch both payment and subscription data
            const [paymentResult, subscriptionResult] = await Promise.all([
              getUserLastPayment(user.email),
              getUserSubscriptions(user.email),
            ]);

            // Find the active subscription (trialing or active status)
            const activeSubscription =
              subscriptionResult.success && subscriptionResult.subscriptions
                ? subscriptionResult.subscriptions.find(
                    (sub) =>
                      sub.status === "trialing" || sub.status === "active",
                  )
                : null;

            return {
              email: user.email,
              lastPayment: paymentResult.success
                ? paymentResult.lastPayment
                : null,
              firstPayment: paymentResult.success
                ? paymentResult.firstPayment
                : null,
              activeSubscription: activeSubscription || null,
            };
          } catch (error) {
            console.error(`Error fetching data for ${user.email}:`, error);
            return {
              email: user.email,
              lastPayment: null,
              firstPayment: null,
              activeSubscription: null,
            };
          }
        }),
      );

      // Update users with payment and subscription data for this batch
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const userData = batchResults.find(
            (result) => result.email === user.email,
          );
          return userData
            ? {
                ...user,
                lastPayment: userData.lastPayment,
                firstPayment: userData.firstPayment,
                activeSubscription: userData.activeSubscription,
              }
            : user;
        }),
      );

      setLoadingProgress({ current: i + batchSize, total: userList.length });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < userList.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Build cache from final user state
    setUsers((prevUsers) => {
      const cacheData: Record<
        string,
        {
          lastPayment: Payment | null;
          firstPayment: Payment | null;
          activeSubscription: Subscription | null;
        }
      > = {};
      prevUsers.forEach((user) => {
        cacheData[user.email] = {
          lastPayment: user.lastPayment || null,
          firstPayment: user.firstPayment || null,
          activeSubscription: user.activeSubscription || null,
        };
      });
      setCachedPayments(cacheData);
      console.log(
        "Cached payment data for",
        Object.keys(cacheData).length,
        "users",
      );
      return prevUsers;
    });

    // Mark as completed
    isLoadingPaymentsRef.current = false;
    hasLoadedPaymentsRef.current = true;
    setLoadingPayments(false);
  };

  // Calculate the membership end date based on payment or subscription
  // Membership is valid for 1 year from payment date
  // Helper to check if a date is valid (reasonable year range)
  const isValidDate = (date: Date): boolean => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return false;
    }
    const year = date.getFullYear();
    return year >= 1990 && year <= 2050;
  };

  const getMembershipEndDate = (user: User): Date | null => {
    // Priority 1: Use subscribedUntil from database if available and valid
    if (user.subscribedUntil) {
      const date = new Date(user.subscribedUntil);
      if (isValidDate(date)) {
        return date;
      }
    }

    // Priority 2: Calculate from payment date (payment date + 1 year)
    // This is the PRIMARY method - membership = 1 year from payment
    if (user.lastPayment && user.lastPayment.status === "succeeded") {
      const paymentDate = new Date(user.lastPayment.created);
      if (isValidDate(paymentDate)) {
        const endDate = new Date(paymentDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        return endDate;
      }
    }

    // Priority 3: Use subscription period end if available (only for active/trialing subscriptions)
    if (
      user.activeSubscription &&
      user.activeSubscription.current_period_end &&
      (user.activeSubscription.status === "active" ||
        user.activeSubscription.status === "trialing")
    ) {
      const date = new Date(user.activeSubscription.current_period_end);
      if (isValidDate(date)) {
        return date;
      }
    }

    return null;
  };

  const isValidRegistration = (user: User): boolean => {
    // Check membership end date based on actual payment
    const membershipEnd = getMembershipEndDate(user);
    if (membershipEnd && membershipEnd > new Date()) {
      return true;
    }

    return false;
  };

  const hasExpiredPayment = (user: User): boolean => {
    // User has expired payment if they have a successful payment but membership has ended
    const membershipEnd = getMembershipEndDate(user);
    if (!membershipEnd) {
      return false;
    }

    return membershipEnd <= new Date();
  };

  // Get the "member since" date, using first payment as fallback if created_at is wrong
  const getMemberSinceDate = (user: User): Date | null => {
    const createdAt = user.created_at ? new Date(user.created_at) : null;
    const now = new Date();

    // If created_at is in the future, it's definitely wrong - use first payment
    // Note: paymentService already converts Stripe timestamps to Date objects
    if (createdAt && createdAt > now && user.firstPayment) {
      return new Date(user.firstPayment.created);
    }

    // If first payment exists and is earlier than created_at, use first payment
    // (this means the user was migrated/recreated after their first payment)
    // Note: paymentService already converts Stripe timestamps to Date objects
    if (user.firstPayment && createdAt) {
      const firstPaymentDate = new Date(user.firstPayment.created);
      if (firstPaymentDate < createdAt) {
        return firstPaymentDate;
      }
    }

    return createdAt;
  };

  const hasFailedPayment = (user: User): boolean => {
    // User has failed payment if their last payment exists but status is not succeeded or pending
    // This matches the display logic that shows "Échoué" for all non-succeeded, non-pending statuses
    if (!user.lastPayment) return false;
    return (
      user.lastPayment.status !== "succeeded" &&
      user.lastPayment.status !== "pending"
    );
  };

  const hasRecurringPayment = (user: User): boolean => {
    // User has recurring payment if:
    // 1. They have an active subscription (active or trialing)
    // 2. The subscription is NOT set to cancel at period end
    if (!user.activeSubscription) return false;
    if (
      user.activeSubscription.status !== "active" &&
      user.activeSubscription.status !== "trialing"
    )
      return false;
    return !user.activeSubscription.cancel_at_period_end;
  };

  const hasOneTimePayment = (user: User): boolean => {
    // User has one-time payment if:
    // 1. They have made at least one successful payment
    // 2. AND they do NOT have an active recurring subscription
    if (!user.lastPayment || user.lastPayment.status !== "succeeded")
      return false;
    // If no subscription, it's one-time
    if (!user.activeSubscription) return true;
    // If subscription is canceled or set to cancel, it's effectively one-time
    if (
      user.activeSubscription.status === "canceled" ||
      user.activeSubscription.cancel_at_period_end
    )
      return true;
    return false;
  };

  const fetchDuplicates = async () => {
    setLoadingDuplicates(true);
    setDuplicatesList([]);
    setDuplicatesSummary(null);

    try {
      const response = await fetch(
        "/api/stripe?action=get-duplicate-subscriptions",
      );
      const result = await response.json();

      if (result.success) {
        setDuplicatesList(result.duplicates);
        setDuplicatesSummary(result.summary);
      }
    } catch (error) {
      console.error("Error fetching duplicates:", error);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setCleaningUp(true);
    setCleanupResult(null);

    try {
      const response = await fetch(
        "/api/stripe?action=cleanup-duplicate-subscriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (result.success) {
        setCleanupResult({
          success: true,
          message: `Nettoyage terminé: ${result.report.subscriptionsCancelled} abonnement(s) en double supprimé(s) pour ${result.report.membersWithDuplicates} membre(s).`,
          details: {
            cancelled: result.report.subscriptionsCancelled,
            errors: result.report.errors.length,
          },
        });
        // Refresh the data after cleanup
        clearCacheAndRefresh();
      } else {
        setCleanupResult({
          success: false,
          message: result.error || "Erreur lors du nettoyage.",
        });
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      setCleanupResult({
        success: false,
        message: "Erreur lors du nettoyage. Veuillez réessayer.",
      });
    } finally {
      setCleaningUp(false);
    }
  };

  const handleSendEmails = async (testMode: boolean = false) => {
    setSendingEmails(true);
    setEmailResult(null);

    try {
      // Get recipients from filtered users
      const recipients = filteredUsers.map((user) => ({
        email: user.email,
        name: user.firstname
          ? `${user.firstname} ${user.lastname || ""}`.trim()
          : null,
      }));

      if (recipients.length === 0) {
        setEmailResult({
          success: false,
          message: "Aucun destinataire trouvé dans la liste filtrée.",
        });
        setSendingEmails(false);
        return;
      }

      const response = await fetch("/api/send-payment-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients,
          subject: emailSubject,
          body: emailBody,
          testMode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailResult({
          success: true,
          message: testMode
            ? `Email de test envoyé avec succès à ${result.results.sent[0]?.email || "l'adresse de test"}.`
            : `${result.summary.sent} email(s) envoyé(s) avec succès.`,
          details: {
            sent: result.summary.sent,
            failed: result.summary.failed,
          },
        });
      } else {
        setEmailResult({
          success: false,
          message: result.error || "Erreur lors de l'envoi des emails.",
        });
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setEmailResult({
        success: false,
        message: "Erreur lors de l'envoi des emails. Veuillez réessayer.",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.hospital?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubscription =
      filterSubscription === "all" || user.subscription === filterSubscription;

    const matchesPaymentStatus =
      filterPaymentStatus === "all" ||
      (filterPaymentStatus === "valid" && isValidRegistration(user)) ||
      (filterPaymentStatus === "expired" && hasExpiredPayment(user)) ||
      (filterPaymentStatus === "failed" && hasFailedPayment(user)) ||
      (filterPaymentStatus === "no-payment" && !user.lastPayment) ||
      (filterPaymentStatus === "recurring" && hasRecurringPayment(user)) ||
      (filterPaymentStatus === "one-time" && hasOneTimePayment(user));

    return matchesSearch && matchesSubscription && matchesPaymentStatus;
  });

  const getSubscriptionLabel = (subscription: string) => {
    const subscriptions: { [key: string]: string } = {
      practicing: "Médecin hospitalier en exercice, Professeur des Universités",
      retired: "Radiologue hospitalier/universitaire retraité",
      assistant: "Radiologue assistant spécialiste",
    };
    return subscriptions[subscription] || subscription;
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    const colors: { [key: string]: string } = {
      practicing: "bg-blue-100 text-blue-800",
      retired: "bg-green-100 text-green-800",
      assistant: "bg-purple-100 text-purple-800",
    };
    return colors[subscription] || "bg-gray-100 text-gray-800";
  };

  const handleUserClick = (userId: number) => {
    navigate(`/profile?id=${userId}`);
  };

  const handleDeleteClick = (user: User, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation to profile
    setDeleteConfirmation({ show: true, user });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.user) return;

    setDeleting(true);
    try {
      const result = await deleteUser(deleteConfirmation.user.id);

      if (result.success) {
        // Remove user from UI
        setUsers((prevUsers) =>
          prevUsers.filter((u) => u.id !== deleteConfirmation.user!.id),
        );
        setDeleteConfirmation({ show: false, user: null });
      } else {
        setError(result.error || "Erreur lors de la suppression du membre");
      }
    } catch {
      setError("Erreur lors de la suppression du membre");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, user: null });
  };

  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return "Date non disponible";

    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "Date invalide";

      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Date invalide";
    }
  };

  const parseProfessionalInfo = (infopro: string | null) => {
    if (!infopro) return [];

    try {
      const parsed = JSON.parse(infopro);
      const labels: string[] = [];

      // Professional info labels mapping
      const labelMap: { [key: string]: string } = {
        huTitulaire: "HU titulaire",
        phLiberal: "PH avec activité libérale",
        hospitaloUniversitaireTitulaire: "Hospitalo-Universitaire titulaire",
        adhesionCollegiale: "Adhésion conjointe à la collégiale de l'AP-HP",
        huLiberal: "HU Libéral",
        hospitaloUniversitaireCCA: "Hospitalo-Universitaire (CCA, AHU, PHU)",
        adhesionAlliance: "Adhésion conjointe à Alliance Hôpital",
        assistantSpecialiste: "Assistant spécialiste hospitalier",
        assistantTempsPartage: "Assistant temps partagé",
      };

      // Extract all true values
      Object.entries(parsed).forEach(([key, value]) => {
        if (value === true && labelMap[key]) {
          labels.push(labelMap[key]);
        }
      });

      return labels;
    } catch (error) {
      console.error("Error parsing professional info:", error);
      return [];
    }
  };

  const exportToCSV = () => {
    // Use ALL users, not just filteredUsers, to ensure we export everyone
    // Apply filters manually if needed
    let usersToExport = users;

    // Apply current filters if any are active
    if (
      searchTerm ||
      filterSubscription !== "all" ||
      filterPaymentStatus !== "all"
    ) {
      usersToExport = filteredUsers;
    }

    // Prepare CSV headers
    const headers = [
      "ID",
      "Prénom",
      "Nom",
      "Email",
      "Établissement",
      "Adresse",
      "Type d'adhésion",
      "Informations professionnelles",
      "Admin",
      "Newsletter",
      "Date d'inscription",
      "Dernière mise à jour",
      "Montant du paiement",
      "Date du paiement",
      "Statut du paiement",
      "Devise",
    ];

    // Prepare CSV rows
    const rows = usersToExport.map((user) => {
      const professionalLabels = parseProfessionalInfo(
        user.infopro || null,
      ).join("; ");

      return [
        user.id,
        user.firstname || "",
        user.lastname || "",
        user.email,
        user.hospital || "",
        user.address || "",
        getSubscriptionLabel(user.subscription || ""),
        professionalLabels,
        user.isadmin ? "Oui" : "Non",
        user.newsletter ? "Activée" : "Désactivée",
        formatDate(user.created_at),
        formatDate(user.updated_at),
        user.lastPayment?.amount || "",
        user.lastPayment ? formatDate(user.lastPayment.created) : "",
        user.lastPayment?.status === "succeeded"
          ? "Réussi"
          : user.lastPayment?.status === "pending"
            ? "En attente"
            : user.lastPayment?.status
              ? "Échoué"
              : "",
        user.lastPayment?.currency || "",
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.map((header) => `"${header}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `membres_srh_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des membres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des Membres
                </h1>
                <p className="text-gray-600 mt-1">
                  {users.length} membres inscrits
                </p>
                {loadingPayments && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-1">
                      Chargement des paiements...{" "}
                      {Math.min(loadingProgress.current, loadingProgress.total)}
                      /{loadingProgress.total}
                    </p>
                    <div className="w-64 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((loadingProgress.current / loadingProgress.total) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearCacheAndRefresh}
                disabled={loadingPayments}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rafraîchir les données Stripe"
              >
                <RefreshCw
                  className={`h-5 w-5 mr-2 ${loadingPayments ? "animate-spin" : ""}`}
                />
                Rafraîchir Stripe
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Exporter la liste des membres en CSV"
              >
                <Download className="h-5 w-5 mr-2" />
                Exporter CSV
              </button>
              <button
                onClick={() => {
                  const template = getEmailTemplate(filterPaymentStatus);
                  setEmailSubject(template.subject);
                  setEmailBody(template.body);
                  setEmailResult(null);
                  setShowEmailModal(true);
                }}
                disabled={filteredUsers.length === 0}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Envoyer un email aux membres filtrés"
              >
                <Send className="h-5 w-5 mr-2" />
                Envoyer Email ({filteredUsers.length})
              </button>
              <button
                onClick={() => {
                  setCleanupResult(null);
                  setShowCleanupModal(true);
                  fetchDuplicates();
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                title="Supprimer les abonnements en double"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Nettoyer doublons
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou établissement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterSubscription}
                  onChange={(e) => setFilterSubscription(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Tous les types d'adhésion</option>
                  <option value="practicing">
                    Médecin hospitalier en exercice, Professeur des Universités
                  </option>
                  <option value="retired">
                    Radiologue hospitalier/universitaire retraité
                  </option>
                  <option value="assistant">
                    Radiologue assistant spécialiste
                  </option>
                </select>
              </div>
            </div>
            <div className="lg:w-64">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts de paiement</option>
                  <option value="valid">
                    Adhésions valides (moins d'1 an)
                  </option>
                  <option value="expired">
                    Adhésions expirées (plus d'1 an)
                  </option>
                  <option value="failed">Paiements échoués</option>
                  <option value="no-payment">Aucun paiement</option>
                  <option value="recurring">Paiement récurrent</option>
                  <option value="one-time">Paiement unique</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => handleUserClick(user.id)}
            >
              <div className="p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstname || ""} {user.lastname || ""}
                    </h3>
                    <div className="flex items-center mt-2">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <a
                        href={`mailto:${user.email}`}
                        className="text-sm text-gray-600 hover:text-red-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Admin Badge */}
                    {user.isadmin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Settings className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(user.subscription || "")}`}
                  >
                    {getSubscriptionLabel(user.subscription || "")}
                  </span>
                </div>

                {/* Professional Information */}
                {(() => {
                  const professionalLabels = parseProfessionalInfo(
                    user.infopro || null,
                  );
                  if (professionalLabels.length > 0) {
                    return (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">
                            Informations professionnelles:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {professionalLabels.map((label, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Hospital */}
                {user.hospital && (
                  <div className="flex items-center mb-3">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">
                      {user.hospital}
                    </span>
                  </div>
                )}

                {/* Address */}
                {user.address && (
                  <div className="flex items-start mb-3">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {user.address}
                    </span>
                  </div>
                )}

                {/* Newsletter */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Newsletter:</span>
                  <span
                    className={`text-sm font-medium ${user.newsletter ? "text-green-600" : "text-gray-400"}`}
                  >
                    {user.newsletter ? "Activée" : "Désactivée"}
                  </span>
                </div>

                {/* Unified Inscription Section */}
                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Inscription:
                    </span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {/* Statut: Valide ou non */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Statut:</span>
                      {/* Show loading if payment data not yet loaded */}
                      {loadingProgress.current < loadingProgress.total &&
                      !user.lastPayment &&
                      !user.activeSubscription ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Chargement...
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isValidRegistration(user)
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {isValidRegistration(user) ? "Valide" : "Expirée"}
                        </span>
                      )}
                    </div>
                    {/* Récurrent ou non */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Récurrent:</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          hasRecurringPayment(user)
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {hasRecurringPayment(user) ? "Oui" : "Non"}
                      </span>
                    </div>
                    {/* Date dernier paiement */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Dernier paiement:
                      </span>
                      <span className="text-sm text-gray-600">
                        {user.lastPayment
                          ? formatDate(user.lastPayment.created)
                          : "Aucun"}
                      </span>
                    </div>
                    {/* Prochain paiement - show for all members with active subscription */}
                    {user.activeSubscription &&
                      (user.activeSubscription.status === "active" ||
                        user.activeSubscription.status === "trialing") && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Prochain paiement:
                          </span>
                          <span className="text-sm text-gray-600">
                            {getMembershipEndDate(user)
                              ? formatDate(getMembershipEndDate(user)!)
                              : formatDate(
                                  user.activeSubscription.current_period_end,
                                )}
                          </span>
                        </div>
                      )}
                    {/* Statut du paiement */}
                    {user.lastPayment && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Statut paiement:
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            user.lastPayment.status === "succeeded"
                              ? "bg-green-100 text-green-800"
                              : user.lastPayment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.lastPayment.status === "succeeded"
                            ? "Réussi"
                            : user.lastPayment.status === "pending"
                              ? "En attente"
                              : "Échoué"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit and Delete Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/edit?id=${user.id}`);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Modifier ce membre"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(user, e)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Supprimer ce membre"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Creation Date and Membership End - Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg mt-auto">
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Membre depuis{" "}
                    {getMemberSinceDate(user)
                      ? formatDate(getMemberSinceDate(user))
                      : formatDate(user.created_at)}
                  </div>
                  {getMembershipEndDate(user) && (
                    <div
                      className={`flex items-center ${getMembershipEndDate(user)! > new Date() ? "text-green-600" : "text-orange-600"}`}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {getMembershipEndDate(user)! > new Date()
                        ? `Adhésion valide jusqu'au ${formatDate(getMembershipEndDate(user))}`
                        : `Adhésion expirée depuis le ${formatDate(getMembershipEndDate(user))}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Aucun membre trouvé avec ces critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Envoyer un email aux membres
              </h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Recipients info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>{filteredUsers.length}</strong> membre(s) recevront
                  cet email selon les filtres actuels.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objet de l'email
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu de l'email
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  L'email inclura automatiquement un en-tête SRH, une salutation
                  personnalisée et un bouton d'accès à l'espace membre.
                </p>
              </div>

              {/* Result message */}
              {emailResult && (
                <div
                  className={`flex items-start p-4 rounded-md ${
                    emailResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {emailResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm ${emailResult.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {emailResult.message}
                    </p>
                    {emailResult.details && emailResult.details.failed > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {emailResult.details.failed} email(s) ont échoué.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={() => handleSendEmails(true)}
                disabled={sendingEmails}
                className="px-4 py-2 text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmails ? "Envoi..." : "Envoyer un test"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailResult(null);
                  }}
                  disabled={sendingEmails}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSendEmails(false)}
                  disabled={sendingEmails || filteredUsers.length === 0}
                  className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sendingEmails ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer à {filteredUsers.length} membre(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Duplicates Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Nettoyer les abonnements en double
              </h2>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Loading state */}
              {loadingDuplicates && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
                  <span className="text-gray-600">
                    Chargement des doublons...
                  </span>
                </div>
              )}

              {/* No duplicates */}
              {!loadingDuplicates &&
                duplicatesList.length === 0 &&
                !cleanupResult && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">
                      Aucun abonnement en double détecté.
                    </p>
                  </div>
                )}

              {/* Duplicates list */}
              {!loadingDuplicates && duplicatesList.length > 0 && (
                <>
                  {/* Summary */}
                  {duplicatesSummary && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-orange-800 font-medium">
                            {duplicatesSummary.membersWithDuplicates} membre(s)
                            avec abonnements en double
                          </p>
                          <p className="text-sm text-orange-700">
                            {duplicatesSummary.subscriptionsToCancel}{" "}
                            abonnement(s) seront annulés
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Members list */}
                  <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {duplicatesList.map((member) => (
                      <div key={member.email} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {member.name || member.email}
                            </p>
                            {member.name && (
                              <p className="text-xs text-gray-500">
                                {member.email}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {member.count} abonnements
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {member.toCancel.length} à supprimer
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="text-green-600">✓ Garder:</span>{" "}
                          {new Date(member.toKeep.created).toLocaleDateString(
                            "fr-FR",
                          )}{" "}
                          ({member.toKeep.amount}€)
                          {!member.toKeep.hasPaymentMethod && (
                            <span className="text-orange-600 ml-2">
                              ⚠ Sans moyen de paiement
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Attention :</strong> Cette action est
                      irréversible. Les abonnements supprimés ne pourront pas
                      être récupérés.
                    </p>
                  </div>
                </>
              )}

              {/* Result message */}
              {cleanupResult && (
                <div
                  className={`flex items-start p-4 rounded-md ${
                    cleanupResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {cleanupResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm ${cleanupResult.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {cleanupResult.message}
                    </p>
                    {cleanupResult.details &&
                      cleanupResult.details.errors > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          {cleanupResult.details.errors} erreur(s)
                          rencontrée(s).
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowCleanupModal(false)}
                disabled={cleaningUp}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Fermer
              </button>
              {duplicatesList.length > 0 && (
                <button
                  onClick={handleCleanupDuplicates}
                  disabled={cleaningUp || loadingDuplicates}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {cleaningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Nettoyage en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer {duplicatesSummary?.subscriptionsToCancel ||
                        0}{" "}
                      doublon(s)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && deleteConfirmation.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3 mr-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir supprimer le membre{" "}
                  <strong>
                    {deleteConfirmation.user.firstname}{" "}
                    {deleteConfirmation.user.lastname}
                  </strong>{" "}
                  ({deleteConfirmation.user.email}) ?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Attention :</strong> Cette action est irréversible.
                    Le membre sera supprimé de la base de données et tous les
                    abonnements Stripe actifs seront annulés.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
