import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Save, Briefcase, AlertCircle, CreditCard, Euro, Calendar 
} from 'lucide-react';
import { getUserById } from '../services/userService';
import { getUserLastPayment, getUserSubscriptions, type Payment, type Subscription } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import StripeCardInput from '../components/StripeCardInput';

// Use VITE_STRIPE_TESTMODE to determine which Stripe keys to use
const isTestMode = import.meta.env.VITE_STRIPE_TESTMODE === 'true';
const stripePublicKey = isTestMode
  ? import.meta.env.VITE_STRIPE_TEST_PUBLIC_API_KEY // Test key
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY; // Live key

const stripePromise = loadStripe(stripePublicKey);

// Stable Elements options to prevent re-renders
const elementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    },
  ],
};

interface UserProfile {
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
  createdAt: Date;
  updatedAt: Date;
}

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  hospital: string;
  address: string;
  subscription: string;
  newsletter: boolean;
  isadmin: boolean;
  // Professional information
  huTitulaire: boolean;
  phLiberal: boolean;
  hospitaloUniversitaireTitulaire: boolean;
  adhesionCollegiale: boolean;
  huLiberal: boolean;
  hospitaloUniversitaireCCA: boolean;
  adhesionAlliance: boolean;
  assistantSpecialiste: boolean;
  assistantTempsPartage: boolean;
}

const ProfileEdit: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'payment'>('personal');
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showCardUpdate, setShowCardUpdate] = useState(false);

  const getSelectedTierData = () => {
    return membershipTiers.find(tier => tier.id === formData.subscription);
  };

  const processStripePayment = async (tierData: any, user: any, stripe: any, elements: any) => {
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not ready');
      }

      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found. Please make sure you have selected a paid membership tier.');
      }

      // Create payment intent on backend first
      const response = await fetch('/api/stripe?action=create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: tierData.price * 100, // Convert to cents
          currency: 'eur',
          customer: {
            email: user.email,
            name: `${user.firstname} ${user.lastname}`,
            hospital: user.hospital,
          },
          recurring: isRecurring,
          tierData: tierData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      // For payments with trial period (1 year free), confirm the card setup (no immediate charge)
      // This applies to BOTH recurring and one-time payments during the trial period
      if (result.clientSecret) {
        let confirmationResult;

        if (result.setupIntentId) {
          // Payment with trial period (recurring OR one-time) - use confirmCardSetup (no charge)
          confirmationResult = await stripe.confirmCardSetup(result.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${user.firstname} ${user.lastname}`,
                email: user.email,
              },
            }
          });
        } else {
          // Immediate payment (no trial) - use confirmCardPayment (immediate charge)
          confirmationResult = await stripe.confirmCardPayment(result.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${user.firstname} ${user.lastname}`,
                email: user.email,
              },
            }
          });
        }

        if (confirmationResult.error) {
          throw new Error(confirmationResult.error.message || 'Confirmation failed');
        }

        return { success: true, data: { ...result, confirmation: confirmationResult } };
      }

      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de paiement' 
      };
    }
  };

  const userId = searchParams.get('id');

  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: '',
    hospital: '',
    address: '',
    subscription: '',
    newsletter: true,
    isadmin: false,
    // Professional information
    huTitulaire: false,
    phLiberal: false,
    hospitaloUniversitaireTitulaire: false,
    adhesionCollegiale: false,
    huLiberal: false,
    hospitaloUniversitaireCCA: false,
    adhesionAlliance: false,
    assistantSpecialiste: false,
    assistantTempsPartage: false,
  });

  const membershipTiers = [
    {
      id: 'practicing',
      title: 'Médecin hospitalier en exercice, Professeur des Universités',
      price: 120,
      actualCost: 40,
      description: 'Pour les radiologues hospitaliers et universitaires en activité'
    },
    {
      id: 'retired',
      title: 'Radiologue hospitalier/universitaire retraité',
      price: 60,
      actualCost: 20,
      description: 'Tarif préférentiel pour nos confrères retraités'
    },
    {
      id: 'assistant',
      title: 'Radiologue assistant spécialiste',
      price: 30,
      actualCost: 10,
      description: 'Tarif adapté aux assistants spécialistes'
    },
    {
      id: 'first-time',
      title: 'Première adhésion (dans l\'année de nomination)',
      price: 0,
      actualCost: 0,
      description: 'Gratuit pour votre première année d\'adhésion'
    }
  ];

  const professionalFields = [
    { key: 'huTitulaire', label: 'HU titulaire' },
    { key: 'phLiberal', label: 'PH avec activité libérale' },
    { key: 'hospitaloUniversitaireTitulaire', label: 'Hospitalo-Universitaire titulaire' },
    { key: 'adhesionCollegiale', label: 'Adhésion conjointe à la collégiale de l\'AP-HP' },
    { key: 'huLiberal', label: 'HU Libéral' },
    { key: 'hospitaloUniversitaireCCA', label: 'Hospitalo-Universitaire (CCA, AHU, PHU)' },
    { key: 'adhesionAlliance', label: 'Adhésion conjointe à Alliance Hôpital' },
    { key: 'assistantSpecialiste', label: 'Assistant spécialiste hospitalier' },
    { key: 'assistantTempsPartage', label: 'Assistant temps partagé' }
  ] as const;

  useEffect(() => {
    if (!userId) {
      setError('Aucun ID utilisateur fourni');
      setLoading(false);
      return;
    }

    fetchUserProfile();
    
    // Check if we should navigate to payment tab from URL hash
    if (window.location.hash === '#payment') {
      setActiveTab('payment');
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const user = await getUserById(userId);
      if (user) {
        setUserProfile(user);
        
        // Fetch payment data
        fetchPaymentData(user.email);
        
        // Parse professional info
        let professionalInfo: any = {};
        if (user.infopro) {
          try {
            professionalInfo = JSON.parse(user.infopro);
          } catch (error) {
            console.error('Error parsing professional info:', error);
          }
        }

        // Populate form data
        setFormData({
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          email: user.email || '',
          hospital: user.hospital || '',
          address: user.address || '',
          subscription: user.subscription || '',
          newsletter: user.newsletter ?? true,
          isadmin: user.isadmin ?? false,
          // Professional information
          huTitulaire: professionalInfo.huTitulaire || false,
          phLiberal: professionalInfo.phLiberal || false,
          hospitaloUniversitaireTitulaire: professionalInfo.hospitaloUniversitaireTitulaire || false,
          adhesionCollegiale: professionalInfo.adhesionCollegiale || false,
          huLiberal: professionalInfo.huLiberal || false,
          hospitaloUniversitaireCCA: professionalInfo.hospitaloUniversitaireCCA || false,
          adhesionAlliance: professionalInfo.adhesionAlliance || false,
          assistantSpecialiste: professionalInfo.assistantSpecialiste || false,
          assistantTempsPartage: professionalInfo.assistantTempsPartage || false,
        });
      } else {
        setError('Utilisateur non trouvé');
      }
    } catch (err) {
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentData = async (email: string) => {
    setPaymentLoading(true);
    try {
      const [paymentResult, subscriptionResult] = await Promise.all([
        getUserLastPayment(email),
        getUserSubscriptions(email)
      ]);
      
      if (paymentResult.success) {
        setCurrentPayment(paymentResult.lastPayment);
      }
      
      if (subscriptionResult.success && subscriptionResult.subscriptions && subscriptionResult.subscriptions.length > 0) {
        // Get the most recent active or trialing subscription
        const activeSubscription = subscriptionResult.subscriptions.find(sub => sub.status === 'active' || sub.status === 'trialing') ||
                                 subscriptionResult.subscriptions[0];
        setCurrentSubscription(activeSubscription);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Check if user is truly in a trial period (new member, no payment yet, waiting for Jan 1st)
  // A user is in trial ONLY if: subscription is 'trialing' AND no successful payment exists
  const isInTrialPeriod = (): boolean => {
    if (!currentSubscription || currentSubscription.status !== 'trialing') {
      return false;
    }
    // If there's a successful payment, user is NOT in trial - they've already paid
    if (currentPayment && currentPayment.status === 'succeeded') {
      return false;
    }
    return true;
  };

  // Get effective subscription status (treats paid 'trialing' as 'active')
  const getEffectiveSubscriptionStatus = (): string => {
    if (!currentSubscription) return '';
    // If subscription is 'trialing' but user has paid, treat as 'active'
    if (currentSubscription.status === 'trialing' && currentPayment && currentPayment.status === 'succeeded') {
      return 'active';
    }
    return currentSubscription.status;
  };

  const isValidRegistration = (): boolean => {
    // First check if there's an active/trialing subscription with valid period
    if (currentSubscription) {
      const isActiveStatus = currentSubscription.status === 'active' || currentSubscription.status === 'trialing';
      if (isActiveStatus && currentSubscription.current_period_end) {
        const periodEnd = new Date(currentSubscription.current_period_end);
        if (periodEnd > new Date()) {
          return true; // Subscription is active and period hasn't ended
        }
      }
    }

    // Fallback: check payment date (for one-time payments without subscription)
    if (!currentPayment || currentPayment.status !== 'succeeded') {
      return false;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return currentPayment.created > oneYearAgo;
  };

  const getPaymentStatus = () => {
    if (!currentPayment) return { label: 'Aucun paiement', color: 'bg-gray-100 text-gray-800' };
    
    if (currentPayment.status !== 'succeeded') {
      return { label: 'Paiement échoué', color: 'bg-red-100 text-red-800' };
    }
    
    if (isValidRegistration()) {
      return { label: 'Adhésion valide', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Adhésion expirée', color: 'bg-orange-100 text-orange-800' };
    }
  };

  const formatDate = (dateInput: string | number | Date) => {
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return 'Date invalide';
    } catch (error) {
      return 'Date invalide';
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !userProfile) return;
    
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir annuler votre abonnement automatique ? Votre adhésion restera active jusqu\'à la fin de la période déjà payée.'
    );
    
    if (confirmed) {
      try {
        const response = await fetch('/api/stripe?action=cancel-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userProfile.email,
            subscriptionId: currentSubscription.id
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Votre abonnement automatique a été annulé. Votre adhésion reste active jusqu\'à la fin de la période payée.');
          // Refresh payment data
          fetchPaymentData(userProfile.email);
        } else {
          alert('Erreur lors de l\'annulation: ' + (result.error || 'Erreur inconnue'));
        }
      } catch (error) {
        alert('Erreur lors de l\'annulation de l\'abonnement.');
      }
    }
  };

  const handleCardUpdate = async () => {
    if (!currentSubscription || !userProfile) return;
    
    setIsPaymentLoading(true);
    
    try {
      const response = await fetch('/api/stripe?action=update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          subscriptionId: currentSubscription.id
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Votre carte bancaire a été mise à jour avec succès.');
        setShowCardUpdate(false);
        // Refresh payment data
        fetchPaymentData(userProfile.email);
      } else {
        alert('Erreur lors de la mise à jour: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour de la carte bancaire.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleMakeRecurring = async () => {
    if (!userProfile || !getSelectedTierData()) return;
    
    const confirmed = window.confirm(
      'Voulez-vous activer le renouvellement automatique de votre adhésion ? Votre carte sera débitée automatiquement chaque année.'
    );
    
    if (!confirmed) return;
    
    setIsPaymentLoading(true);
    
    try {
      const selectedTierData = getSelectedTierData();
      
      const response = await fetch('/api/stripe?action=create-recurring-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          tierData: selectedTierData || {
            id: formData.subscription,
            title: membershipTiers.find(t => t.id === formData.subscription)?.title,
            price: membershipTiers.find(t => t.id === formData.subscription)?.price || 0
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Abonnement automatique activé avec succès ! Votre adhésion se renouvellera automatiquement chaque année.');
        // Refresh payment data
        fetchPaymentData(userProfile.email);
      } else {
        alert('Erreur lors de l\'activation: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      alert('Erreur lors de l\'activation de l\'abonnement automatique.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription || !userProfile) return;
    
    const confirmed = window.confirm(
      'Voulez-vous réactiver votre abonnement automatique ? Le renouvellement automatique reprendra à la fin de la période actuelle.'
    );
    
    if (!confirmed) return;
    
    setIsPaymentLoading(true);
    
    try {
      const response = await fetch('/api/stripe?action=reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userProfile.email,
          subscriptionId: currentSubscription.id
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Votre abonnement automatique a été réactivé avec succès ! Le renouvellement reprendra à la fin de la période actuelle.');
        // Refresh payment data
        fetchPaymentData(userProfile.email);
      } else {
        alert('Erreur lors de la réactivation: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      alert('Erreur lors de la réactivation de l\'abonnement.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const updateSubscriptionOnly = async () => {
    if (!userId) return;

    try {
      // Only update the subscription field
      const response = await fetch(`/api/user-management?action=profile&id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: formData.subscription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'adhésion');
      }

      // Refresh user profile data
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError('');

    try {
      // Call update API using the correct endpoint
      const response = await fetch(`/api/user-management?action=profile&id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          hospital: formData.hospital,
          address: formData.address,
          subscription: formData.subscription,
          newsletter: formData.newsletter,
          isadmin: formData.isadmin,
          // Professional information fields (sent individually)
          huTitulaire: formData.huTitulaire,
          phLiberal: formData.phLiberal,
          hospitaloUniversitaireTitulaire: formData.hospitaloUniversitaireTitulaire,
          adhesionCollegiale: formData.adhesionCollegiale,
          huLiberal: formData.huLiberal,
          hospitaloUniversitaireCCA: formData.hospitaloUniversitaireCCA,
          adhesionAlliance: formData.adhesionAlliance,
          assistantSpecialiste: formData.assistantSpecialiste,
          assistantTempsPartage: formData.assistantTempsPartage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate back to profile page
        navigate(`/profile?id=${userId}`);
      } else {
        setError(result.error || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Update error:', error);
      setError('Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/profile?id=${userId}`);
  };

  // Check if the current user can edit this profile (own profile or admin)
  const canEdit = currentUser && userProfile && 
    (currentUser.id === userProfile.id.toString() || currentUser.isadmin === true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile || !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          
          <p className="text-gray-600 mb-6">
            {error || 'Vous ne pouvez modifier que votre propre profil ou vous devez être administrateur.'}
          </p>

          <button
            onClick={handleBack}
            className="w-full bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // PaymentHandler component for processing payments
  const PaymentHandler = () => {
    const stripe = useStripe();
    const elements = useElements();

    const handlePaymentClick = async () => {
      setIsPaymentLoading(true);

      try {
        const selectedTierData = getSelectedTierData();
        if (!selectedTierData) {
          alert('Veuillez sélectionner un type d\'adhésion.');
          setIsPaymentLoading(false);
          return;
        }

        // Check if user already has a valid AUTOMATIC subscription (not one-time)
        // Allow payment if subscription is set to cancel at period end (one-time payment)
        if (isValidRegistration() && currentSubscription &&
            getEffectiveSubscriptionStatus() === 'active' &&
            !currentSubscription.cancel_at_period_end) {
          alert('Vous avez déjà une adhésion active avec renouvellement automatique. Aucun paiement supplémentaire n\'est nécessaire.');
          setIsPaymentLoading(false);
          return;
        }

        // Process payment if needed
        if (selectedTierData.price > 0) {
          // Ensure Stripe and elements are ready for paid tiers
          if (!stripe || !elements) {
            alert('Le système de paiement n\'est pas encore prêt. Veuillez réessayer dans quelques instants.');
            setIsPaymentLoading(false);
            return;
          }

          const paymentResult = await processStripePayment(
            selectedTierData, 
            {
              email: formData.email,
              firstname: formData.firstname,
              lastname: formData.lastname,
              hospital: formData.hospital
            }, 
            stripe, 
            elements
          );
          if (!paymentResult.success) {
            alert(paymentResult.error || 'Erreur lors du paiement');
            setIsPaymentLoading(false);
            return;
          }
          
          // Payment successful, just refresh payment data
          await fetchPaymentData(formData.email);
          alert('Paiement effectué avec succès ! Votre adhésion a été renouvelée.');
        } else {
          // Free tier, only update subscription field
          await updateSubscriptionOnly();
          alert('Adhésion mise à jour avec succès !');
        }

      } catch (error) {
        console.error('Payment error:', error);
        alert('Erreur lors du paiement. Veuillez réessayer.');
      } finally {
        setIsPaymentLoading(false);
      }
    };

    // Check if user has automatic subscription (not one-time)
    const hasAutoRenewal = isValidRegistration() && currentSubscription &&
                           getEffectiveSubscriptionStatus() === 'active' &&
                           !currentSubscription.cancel_at_period_end;

    return (
      <button
        onClick={handlePaymentClick}
        disabled={!formData.subscription || isPaymentLoading ||
                  (!stripe && (getSelectedTierData()?.price ?? 0) > 0) ||
                  hasAutoRenewal}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isPaymentLoading
          ? 'Traitement en cours...'
          : hasAutoRenewal
            ? 'Adhésion avec renouvellement automatique'
            : getSelectedTierData()?.price === 0
              ? 'Mettre à jour l\'adhésion'
              : isValidRegistration()
                ? 'Payer pour l\'année prochaine'
                : isRecurring
                  ? 'Souscrire l\'abonnement annuel'
                  : 'Effectuer le paiement'
        }
      </button>
    );
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-srh-blue transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </button>
            
            <div className="flex items-center">
              <div className="bg-srh-blue p-3 rounded-lg mr-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Modifier mon profil</h1>
                <p className="text-gray-600 mt-1">Mettre à jour mes informations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex w-full">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 py-2 px-4 border-b-2 font-medium text-sm text-center ${
                    activeTab === 'personal'
                      ? 'border-srh-blue text-srh-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-5 w-5 mr-2 inline" />
                  Informations Personnelles
                </button>
                <button
                  onClick={() => setActiveTab('professional')}
                  className={`flex-1 py-2 px-4 border-b-2 font-medium text-sm text-center ${
                    activeTab === 'professional'
                      ? 'border-srh-blue text-srh-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Briefcase className="h-5 w-5 mr-2 inline" />
                  Informations Professionnelles
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`flex-1 py-2 px-4 border-b-2 font-medium text-sm text-center ${
                    activeTab === 'payment'
                      ? 'border-srh-blue text-srh-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mr-2 inline" />
                  Règlement
                </button>
              </nav>
            </div>

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Informations Personnelles</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                    Établissement hospitalier *
                  </label>
                  <input
                    type="text"
                    id="hospital"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="subscription" className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'adhésion
                  </label>
                  <select
                    id="subscription"
                    name="subscription"
                    value={formData.subscription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                  >
                    <option value="">Sélectionner un type d'adhésion</option>
                    {membershipTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="newsletter"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
                  />
                  <label htmlFor="newsletter" className="text-sm text-gray-700">
                    Je souhaite recevoir la newsletter du SRH
                  </label>
                </div>

                {/* Admin checkbox - only visible to admins */}
                {currentUser?.isadmin && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isadmin"
                      name="isadmin"
                      checked={formData.isadmin}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
                    />
                    <label htmlFor="isadmin" className="text-sm text-gray-700">
                      Administrateur
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Professional Information Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Informations Professionnelles</h3>
                <p className="text-gray-600">Cochez les cases correspondant à votre situation professionnelle :</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionalFields.map((field) => (
                    <div key={field.key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={field.key}
                        name={field.key}
                        checked={formData[field.key]}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
                      />
                      <label htmlFor={field.key} className="text-sm text-gray-700">
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Gestion des paiements</h3>
                <p className="text-gray-600">Consultez et gérez vos informations de paiement</p>
                
                {/* Current Payment Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Statut actuel de l'adhésion</h4>
                  {paymentLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-srh-blue" />
                      <span className="ml-2 text-sm text-gray-600">Chargement des informations...</span>
                    </div>
                  ) : currentPayment ? (
                    <div className="space-y-4">
                      {/* Payment Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut de l'adhésion:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatus().color}`}>
                          {getPaymentStatus().label}
                        </span>
                      </div>
                      
                      {/* Payment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Montant payé:</span>
                          <div className="text-lg font-semibold text-green-600 flex items-center">
                            <Euro className="h-4 w-4 mr-1" />
                            {currentPayment.amount} €
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Date de paiement:</span>
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(currentPayment.created)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Type d'abonnement:</span>
                          <div className="text-sm text-gray-900">
                            {currentSubscription ? 'Abonnement automatique' : 'Paiement unique'}
                            {currentSubscription && (
                              <span className={`ml-2 ${
                                getEffectiveSubscriptionStatus() === 'active' || getEffectiveSubscriptionStatus() === 'trialing'
                                  ? 'text-green-600'
                                  : getEffectiveSubscriptionStatus() === 'canceled'
                                    ? 'text-orange-600'
                                    : 'text-red-600'
                              }`}>
                                ✓ {getEffectiveSubscriptionStatus() === 'active' ? 'Actif' :
                                   isInTrialPeriod() ? 'Période d\'essai' :
                                   getEffectiveSubscriptionStatus() === 'canceled' ? 'Annulé' :
                                   'Inactif'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Fin d'adhésion:</span>
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {currentSubscription ? 
                              formatDate(currentSubscription.current_period_end) :
                              (() => {
                                const endDate = new Date(currentPayment.created);
                                endDate.setFullYear(endDate.getFullYear() + 1);
                                return formatDate(endDate);
                              })()
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Recurring Payment Advice */}
                      {!currentSubscription && isValidRegistration() && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start">
                            <CreditCard className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                            <div>
                              <h5 className="text-sm font-medium text-blue-900">Conseil : Activez l'abonnement automatique</h5>
                              <p className="text-sm text-blue-800 mt-1">
                                Pour ne jamais oublier de renouveler votre adhésion, activez l'abonnement automatique.
                                Votre carte sera débitée automatiquement chaque année à la même date.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Management Actions */}
                      {currentSubscription && (
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                          <h5 className="font-medium text-gray-900">Gestion de l'abonnement</h5>
                          <div className="flex flex-wrap gap-3">
                            {/* Show different buttons based on effective subscription status */}
                            {(getEffectiveSubscriptionStatus() === 'active' || getEffectiveSubscriptionStatus() === 'trialing') && !(currentSubscription.cancel_at_period_end ?? false) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowCardUpdate(!showCardUpdate)}
                                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
                                >
                                  {showCardUpdate ? 'Annuler' : 'Modifier la carte bancaire'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelSubscription}
                                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors"
                                >
                                  Annuler l'abonnement automatique
                                </button>
                              </>
                            )}

                            {/* Show reactivate button if subscription was canceled */}
                            {(((getEffectiveSubscriptionStatus() === 'active' || getEffectiveSubscriptionStatus() === 'trialing') && (currentSubscription.cancel_at_period_end ?? false)) ||
                             getEffectiveSubscriptionStatus() === 'canceled') && (
                              <button
                                type="button"
                                onClick={handleReactivateSubscription}
                                disabled={isPaymentLoading}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                              >
                                {isPaymentLoading ? 'Activation...' : 'Réactiver l\'abonnement automatique'}
                              </button>
                            )}
                          </div>
                          
                          {/* Card Update Form */}
                          {showCardUpdate && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-3">Mettre à jour la carte bancaire</h6>
                              <StripeCardInput />
                              <div className="flex gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={handleCardUpdate}
                                  disabled={isPaymentLoading}
                                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {isPaymentLoading ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowCardUpdate(false)}
                                  className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucun paiement trouvé</p>
                    </div>
                  )}
                </div>
                
                {/* Make Payment Recurrent for Valid One-time Payments or No Active Subscription */}
                {(!currentSubscription || 
                  (currentSubscription && currentSubscription.status === 'canceled') || 
                  (currentSubscription && currentSubscription.cancel_at_period_end)) && 
                 isValidRegistration() && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Activer l'abonnement automatique</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">
                            {currentSubscription ? 'Réactiver l\'abonnement automatique' : 'Convertir en abonnement automatique'}
                          </h5>
                          <p className="text-sm text-blue-800 mb-4">
                            {currentSubscription 
                              ? 'Votre abonnement a été annulé mais reste actif jusqu\'à la fin de la période. Réactivez-le pour continuer le renouvellement automatique.'
                              : 'Activez le renouvellement automatique pour ne jamais oublier votre adhésion. Votre carte sera débitée automatiquement chaque année.'
                            }
                          </p>
                          <button
                            type="button"
                            onClick={() => currentSubscription ? handleReactivateSubscription() : handleMakeRecurring()}
                            disabled={isPaymentLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isPaymentLoading 
                              ? 'Activation en cours...' 
                              : currentSubscription 
                                ? 'Réactiver l\'abonnement automatique'
                                : 'Activer l\'abonnement automatique'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Message for users with valid automatic subscriptions */}
                {(isValidRegistration() && currentPayment) &&
                 (currentSubscription && (getEffectiveSubscriptionStatus() === 'active' || getEffectiveSubscriptionStatus() === 'trialing') && !(currentSubscription.cancel_at_period_end ?? false)) && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CreditCard className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-medium text-green-900 mb-2">
                            Votre adhésion est active
                          </h5>
                          <p className="text-sm text-green-800">
                            Votre abonnement automatique est actif et se renouvellera automatiquement le{' '}
                            {currentSubscription ? formatDate(currentSubscription.current_period_end) : 'à la date prévue'}.
                            Aucune action n'est requise de votre part.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment/Renewal Section - Show for users who need to pay manually */}
                {/* Show if: no subscription, canceled subscription, OR subscription set to cancel (one-time payment) */}
                {(!currentSubscription ||
                  getEffectiveSubscriptionStatus() === 'canceled' ||
                  (currentSubscription && currentSubscription.cancel_at_period_end)) && (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {isValidRegistration() ? 'Renouveler pour l\'année prochaine' : 'Renouveler ou modifier l\'adhésion'}
                      </h4>
                      {isValidRegistration() && currentSubscription?.cancel_at_period_end && (
                        <p className="text-sm text-gray-600 mb-4">
                          Votre adhésion actuelle est valide jusqu'au {formatDate(currentSubscription.current_period_end)}.
                          Vous pouvez dès maintenant régler votre adhésion pour l'année suivante.
                        </p>
                      )}
                    </div>
                
                {/* Subscription Selection */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Type d'adhésion</h4>
                  <select
                    id="subscription"
                    name="subscription"
                    value={formData.subscription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                  >
                    <option value="">Sélectionner un type d'adhésion</option>
                    {membershipTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.title} - {tier.price === 0 ? 'Gratuit' : `${tier.price} €`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Summary */}
                {getSelectedTierData() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Récapitulatif de votre adhésion</h4>
                    <div className="flex justify-between items-center">
                      <span>{getSelectedTierData()?.title}</span>
                      <span className="font-bold">
                        {getSelectedTierData()?.price === 0 ? 'Gratuit' : `${getSelectedTierData()?.price} €${isRecurring ? '/an' : ''}`}
                      </span>
                    </div>
                    {(getSelectedTierData()?.price || 0) > 0 && (
                      <div className="text-sm text-green-600 mt-1">
                        Coût réel après déduction fiscale : {getSelectedTierData()?.actualCost} €{isRecurring ? '/an' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Type */}
                {getSelectedTierData() && (getSelectedTierData()?.price || 0) > 0 && (
                  <>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Type de paiement</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="one-time"
                            name="paymentType"
                            checked={!isRecurring}
                            onChange={() => setIsRecurring(false)}
                            className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300"
                          />
                          <label htmlFor="one-time" className="ml-3 text-sm text-gray-700">
                            <span className="font-medium">Paiement unique</span>
                            <div className="text-gray-500">Adhésion pour l'année en cours uniquement</div>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="recurring"
                            name="paymentType"
                            checked={isRecurring}
                            onChange={() => setIsRecurring(true)}
                            className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300"
                          />
                          <label htmlFor="recurring" className="ml-3 text-sm text-gray-700">
                            <span className="font-medium">Abonnement annuel automatique</span>
                            <div className="text-gray-500">Renouvellement automatique chaque année (résiliable à tout moment)</div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <StripeCardInput />
                  </>
                )}
                </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Button for Payment Tab - Show when renewal section is visible */}
      {activeTab === 'payment' && getSelectedTierData() &&
       (!currentSubscription ||
        getEffectiveSubscriptionStatus() === 'canceled' ||
        (currentSubscription && currentSubscription.cancel_at_period_end)) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-center">
              <PaymentHandler />
            </div>
          </div>
        </div>
      )}
    </div>
    </Elements>
  );
};

export default ProfileEdit;