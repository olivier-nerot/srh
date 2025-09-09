import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Building2, MapPin, Calendar, 
  ArrowLeft, Shield, Briefcase, Bell, BellOff, Edit, CreditCard, Euro
} from 'lucide-react';
import { getUserById } from '../services/userService';
import { getUserLastPayment, type Payment } from '../services/paymentService';
import { useAuthStore } from '../stores/authStore';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

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

const Profile: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const userId = searchParams.get('id');

  useEffect(() => {
    if (!userId) {
      setError('Aucun ID utilisateur fourni');
      setLoading(false);
      return;
    }

    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const user = await getUserById(userId);
      if (user) {
        setUserProfile(user);
        // Fetch payment data in background
        fetchPaymentData(user.email);
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
      const paymentResult = await getUserLastPayment(email);
      if (paymentResult.success) {
        setPayment(paymentResult.lastPayment);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getSubscriptionLabel = (subscription: string) => {
    const subscriptions: { [key: string]: string } = {
      'practicing': 'Médecin hospitalier en exercice',
      'retired': 'Radiologue hospitalier/universitaire retraité',
      'assistant': 'Assistant spécialiste',
      'first-time': 'Première adhésion'
    };
    return subscriptions[subscription] || subscription;
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    const colors: { [key: string]: string } = {
      'practicing': 'bg-blue-100 text-blue-800',
      'retired': 'bg-green-100 text-green-800',
      'assistant': 'bg-purple-100 text-purple-800',
      'first-time': 'bg-yellow-100 text-yellow-800'
    };
    return colors[subscription] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateInput: string | number | Date) => {
    try {
      // Use the utility function that handles all timestamp formats
      const formattedDate = formatDateToDDMMYYYY(dateInput);
      if (formattedDate === 'Date invalide') {
        return 'Date invalide';
      }
      
      // Convert DD/MM/YYYY to a more readable format
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
      console.error('Error formatting date:', dateInput, error);
      return 'Date invalide';
    }
  };

  const isValidRegistration = (): boolean => {
    if (!payment || payment.status !== 'succeeded') {
      return false;
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return payment.created > oneYearAgo;
  };

  const getPaymentStatus = () => {
    if (!payment) return { label: 'Aucun paiement', color: 'bg-gray-100 text-gray-800' };
    
    if (payment.status !== 'succeeded') {
      return { label: 'Paiement échoué', color: 'bg-red-100 text-red-800' };
    }
    
    if (isValidRegistration()) {
      return { label: 'Adhésion valide', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Adhésion expirée', color: 'bg-orange-100 text-orange-800' };
    }
  };

  const parseProfessionalInfo = (infopro: string | null) => {
    if (!infopro) return [];
    
    try {
      const parsed = JSON.parse(infopro);
      const labels: string[] = [];
      
      const labelMap: { [key: string]: string } = {
        'huTitulaire': 'HU titulaire',
        'phLiberal': 'PH Libéral',
        'hospitaloUniversitaireTitulaire': 'Hospitalo-Universitaire titulaire',
        'adhesionCollegiale': 'Adhésion conjointe à la collégiale de l\'AP-HP',
        'huLiberal': 'HU Libéral',
        'hospitaloUniversitaireCCA': 'Hospitalo-Universitaire (CCA, AHU, PHU)',
        'adhesionAlliance': 'Adhésion conjointe à Alliance Hôpital',
        'assistantSpecialiste': 'Assistant spécialiste hospitalier',
        'assistantTempsPartage': 'Assistant temps partagé'
      };

      Object.entries(parsed).forEach(([key, value]) => {
        if (value === true && labelMap[key]) {
          labels.push(labelMap[key]);
        }
      });

      return labels;
    } catch (error) {
      console.error('Error parsing professional info:', error);
      return [];
    }
  };

  const handleBack = () => {
    // Go back to admin members if current user is admin, otherwise go to home
    if (currentUser?.isadmin) {
      navigate('/admin/members');
    } else {
      navigate('/');
    }
  };

  const handleEdit = () => {
    navigate(`/profile/edit?id=${userId}`);
  };

  // Check if the current user is viewing their own profile or is an admin
  const isOwnProfile = currentUser && userProfile && currentUser.id === userProfile.id.toString();
  const canEdit = isOwnProfile || (currentUser?.isadmin === true);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <User className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil non trouvé</h1>
          
          <p className="text-gray-600 mb-6">
            {error || 'Le profil demandé n\'existe pas ou n\'est plus disponible.'}
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="w-full bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const professionalLabels = parseProfessionalInfo(userProfile.infopro || null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
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
                <h1 className="text-2xl font-bold text-gray-900">Profil Membre</h1>
                <p className="text-gray-600 mt-1">Informations détaillées</p>
              </div>
            </div>
            
            <div className="flex items-center">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h2 className="text-3xl font-bold text-gray-900 mr-4">
                    {userProfile.firstname || ''} {userProfile.lastname || ''}
                  </h2>
                  {userProfile.isadmin && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <Shield className="h-4 w-4 mr-1" />
                      Administrateur
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <a 
                    href={`mailto:${userProfile.email}`} 
                    className="text-lg text-gray-600 hover:text-srh-blue transition-colors"
                  >
                    {userProfile.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Subscription Type */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Type d'adhésion</h3>
                  <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getSubscriptionBadgeColor(userProfile.subscription || '')}`}>
                    {getSubscriptionLabel(userProfile.subscription || '')}
                  </span>
                </div>

                {/* Professional Information */}
                {professionalLabels.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Briefcase className="h-5 w-5 text-gray-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Informations professionnelles</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {professionalLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newsletter Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {userProfile.newsletter ? (
                        <Bell className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <BellOff className="h-5 w-5 text-gray-400 mr-2" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">Newsletter</h3>
                    </div>
                    <span className={`text-sm font-medium ${userProfile.newsletter ? 'text-green-600' : 'text-gray-400'}`}>
                      {userProfile.newsletter ? 'Activée' : 'Désactivée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                  <div className="space-y-4">
                    {userProfile.hospital && (
                      <div className="flex items-start">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Établissement</p>
                          <p className="text-gray-900">{userProfile.hospital}</p>
                        </div>
                      </div>
                    )}
                    
                    {userProfile.address && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Adresse</p>
                          <p className="text-gray-900">{userProfile.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de paiement</h3>
                  {paymentLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-srh-blue"></div>
                      <span className="ml-2 text-sm text-gray-600">Chargement des paiements...</span>
                    </div>
                  ) : payment ? (
                    <div className="space-y-4">
                      {/* Payment Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut de l'adhésion:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatus().color}`}>
                          {getPaymentStatus().label}
                        </span>
                      </div>
                      
                      {/* Payment Details */}
                      <div className="border-t border-gray-200 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Montant:</span>
                          <span className="text-sm font-medium text-green-600 flex items-center">
                            <Euro className="h-3 w-3 mr-1" />
                            {payment.amount} €
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Date de paiement:</span>
                          <span className="text-sm text-gray-900">
                            {formatDate(payment.created)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">ID de transaction:</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {payment.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucun paiement trouvé</p>
                    </div>
                  )}
                  
                  {/* Payment Action Button */}
                  {isOwnProfile && !isValidRegistration() && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/edit?id=${userId}#payment`)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Renouveler mon adhésion
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Votre adhésion a expiré ou n'est pas valide. Cliquez pour la renouveler.
                      </p>
                    </div>
                  )}
                </div>

                {/* Account Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Membre depuis</p>
                        <p className="text-gray-900">{formatDate(userProfile.createdAt)}</p>
                      </div>
                    </div>
                    
                    {userProfile.subscribedUntil && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Abonnement jusqu'au</p>
                          <p className="text-gray-900">{formatDate(userProfile.subscribedUntil)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;