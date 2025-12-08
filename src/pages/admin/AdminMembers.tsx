import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Building2, MapPin, Calendar, Settings, Search, Filter, Briefcase, CreditCard, Euro, Trash2, Download } from 'lucide-react';
import { getAllUsers, deleteUser } from '../../services/userService';
import { getUserLastPayment, getUserSubscriptions, type Payment, type Subscription } from '../../services/paymentService';

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
  activeSubscription?: Subscription | null;
}

const AdminMembers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; user: User | null }>({
    show: false,
    user: null
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        // Set users immediately without payment data
        const usersWithoutPayments = result.users.map((user: User) => ({
          ...user,
          lastPayment: null
        }));
        setUsers(usersWithoutPayments);
        setLoading(false);
        
        // Start background payment loading
        loadPaymentsInBackground(result.users);
      } else {
        setError(result.error || 'Erreur lors du chargement des membres');
        setLoading(false);
      }
    } catch (err) {
      setError('Erreur lors du chargement des membres');
      setLoading(false);
    }
  };

  const loadPaymentsInBackground = async (userList: User[]) => {
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
              getUserSubscriptions(user.email)
            ]);

            // Find the active subscription (trialing or active status)
            const activeSubscription = subscriptionResult.success && subscriptionResult.subscriptions
              ? subscriptionResult.subscriptions.find(sub =>
                  sub.status === 'trialing' || sub.status === 'active'
                )
              : null;

            return {
              email: user.email,
              lastPayment: paymentResult.success ? paymentResult.lastPayment : null,
              activeSubscription: activeSubscription || null
            };
          } catch (error) {
            console.error(`Error fetching data for ${user.email}:`, error);
            return {
              email: user.email,
              lastPayment: null,
              activeSubscription: null
            };
          }
        })
      );

      // Update users with payment and subscription data for this batch
      setUsers(prevUsers =>
        prevUsers.map(user => {
          const userData = batchResults.find(result => result.email === user.email);
          return userData
            ? { ...user, lastPayment: userData.lastPayment, activeSubscription: userData.activeSubscription }
            : user;
        })
      );

      setLoadingProgress({ current: i + batchSize, total: userList.length });

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < userList.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setLoadingPayments(false);
  };

  const isValidRegistration = (user: User): boolean => {
    if (!user.lastPayment || user.lastPayment.status !== 'succeeded') {
      return false;
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return user.lastPayment.created > oneYearAgo;
  };

  const hasExpiredPayment = (user: User): boolean => {
    // User has expired payment if they have a successful payment that's older than 1 year
    if (!user.lastPayment || user.lastPayment.status !== 'succeeded') {
      return false;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return user.lastPayment.created <= oneYearAgo;
  };

  const hasFailedPayment = (user: User): boolean => {
    // User has failed payment if their last payment exists but status is not succeeded or pending
    // This matches the display logic that shows "Échoué" for all non-succeeded, non-pending statuses
    if (!user.lastPayment) return false;
    return user.lastPayment.status !== 'succeeded' && user.lastPayment.status !== 'pending';
  };

  const hasFreeFirstYear = (user: User): boolean => {
    // User has free first year if:
    // 1. They have NO successful payment yet (no lastPayment or payment not succeeded)
    // 2. They have an active subscription in trialing status
    if (!user.activeSubscription) return false;
    if (user.activeSubscription.status !== 'trialing') return false;
    if (user.lastPayment && user.lastPayment.status === 'succeeded') return false;
    return true;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.hospital?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubscription = filterSubscription === 'all' || user.subscription === filterSubscription;
    
    const matchesPaymentStatus =
      filterPaymentStatus === 'all' ||
      (filterPaymentStatus === 'valid' && isValidRegistration(user)) ||
      (filterPaymentStatus === 'expired' && hasExpiredPayment(user)) ||
      (filterPaymentStatus === 'failed' && hasFailedPayment(user)) ||
      (filterPaymentStatus === 'no-payment' && !user.lastPayment && !hasFreeFirstYear(user)) ||
      (filterPaymentStatus === 'free-first-year' && hasFreeFirstYear(user));

    return matchesSearch && matchesSubscription && matchesPaymentStatus;
  });

  const getSubscriptionLabel = (subscription: string) => {
    const subscriptions: { [key: string]: string } = {
      'practicing': 'Médecin hospitalier en exercice, Professeur des Universités',
      'retired': 'Radiologue hospitalier/universitaire retraité',
      'assistant': 'Radiologue assistant spécialiste'
    };
    return subscriptions[subscription] || subscription;
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    const colors: { [key: string]: string } = {
      'practicing': 'bg-blue-100 text-blue-800',
      'retired': 'bg-green-100 text-green-800',
      'assistant': 'bg-purple-100 text-purple-800'
    };
    return colors[subscription] || 'bg-gray-100 text-gray-800';
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
        setUsers(prevUsers => prevUsers.filter(u => u.id !== deleteConfirmation.user!.id));
        setDeleteConfirmation({ show: false, user: null });
      } else {
        setError(result.error || 'Erreur lors de la suppression du membre');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du membre');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, user: null });
  };

  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Date non disponible';
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const parseProfessionalInfo = (infopro: string | null) => {
    if (!infopro) return [];
    
    try {
      const parsed = JSON.parse(infopro);
      const labels: string[] = [];
      
      // Professional info labels mapping
      const labelMap: { [key: string]: string } = {
        'huTitulaire': 'HU titulaire',
        'phLiberal': 'PH avec activité libérale',
        'hospitaloUniversitaireTitulaire': 'Hospitalo-Universitaire titulaire',
        'adhesionCollegiale': 'Adhésion conjointe à la collégiale de l\'AP-HP',
        'huLiberal': 'HU Libéral',
        'hospitaloUniversitaireCCA': 'Hospitalo-Universitaire (CCA, AHU, PHU)',
        'adhesionAlliance': 'Adhésion conjointe à Alliance Hôpital',
        'assistantSpecialiste': 'Assistant spécialiste hospitalier',
        'assistantTempsPartage': 'Assistant temps partagé'
      };

      // Extract all true values
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

  const exportToCSV = () => {
    // Use ALL users, not just filteredUsers, to ensure we export everyone
    // Apply filters manually if needed
    let usersToExport = users;

    // Apply current filters if any are active
    if (searchTerm || filterSubscription !== 'all' || filterPaymentStatus !== 'all') {
      usersToExport = filteredUsers;
    }

    // Prepare CSV headers
    const headers = [
      'ID',
      'Prénom',
      'Nom',
      'Email',
      'Établissement',
      'Adresse',
      'Type d\'adhésion',
      'Informations professionnelles',
      'Admin',
      'Newsletter',
      'Date d\'inscription',
      'Dernière mise à jour',
      'Montant du paiement',
      'Date du paiement',
      'Statut du paiement',
      'Devise'
    ];

    // Prepare CSV rows
    const rows = usersToExport.map(user => {
      const professionalLabels = parseProfessionalInfo(user.infopro || null).join('; ');

      return [
        user.id,
        user.firstname || '',
        user.lastname || '',
        user.email,
        user.hospital || '',
        user.address || '',
        getSubscriptionLabel(user.subscription || ''),
        professionalLabels,
        user.isadmin ? 'Oui' : 'Non',
        user.newsletter ? 'Activée' : 'Désactivée',
        formatDate(user.created_at),
        formatDate(user.updated_at),
        user.lastPayment?.amount || '',
        user.lastPayment ? formatDate(user.lastPayment.created) : '',
        user.lastPayment?.status === 'succeeded' ? 'Réussi' :
         user.lastPayment?.status === 'pending' ? 'En attente' :
         user.lastPayment?.status ? 'Échoué' : '',
        user.lastPayment?.currency || ''
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.map(header => `"${header}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `membres_srh_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

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
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Membres</h1>
                <p className="text-gray-600 mt-1">{users.length} membres inscrits</p>
                {loadingPayments && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-1">
                      Chargement des paiements... {Math.min(loadingProgress.current, loadingProgress.total)}/{loadingProgress.total}
                    </p>
                    <div className="w-64 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((loadingProgress.current / loadingProgress.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              title="Exporter la liste des membres en CSV"
            >
              <Download className="h-5 w-5 mr-2" />
              Exporter CSV
            </button>
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
                  <option value="practicing">Médecin hospitalier en exercice, Professeur des Universités</option>
                  <option value="retired">Radiologue hospitalier/universitaire retraité</option>
                  <option value="assistant">Radiologue assistant spécialiste</option>
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
                  <option value="valid">Adhésions valides (moins d'1 an)</option>
                  <option value="expired">Adhésions expirées (plus d'1 an)</option>
                  <option value="failed">Paiements échoués</option>
                  <option value="free-first-year">Première année gratuite</option>
                  <option value="no-payment">Aucun paiement</option>
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
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleUserClick(user.id)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstname || ''} {user.lastname || ''}
                    </h3>
                    {user.isadmin && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
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
                    {/* Registration Status Badge - Only show "Valide" */}
                    {isValidRegistration(user) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Valide
                      </span>
                    )}
                  </div>
                </div>

                {/* Subscription */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadgeColor(user.subscription || '')}`}>
                    {getSubscriptionLabel(user.subscription || '')}
                  </span>
                </div>

                {/* Professional Information */}
                {(() => {
                  const professionalLabels = parseProfessionalInfo(user.infopro || null);
                  if (professionalLabels.length > 0) {
                    return (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Informations professionnelles:</span>
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
                    <span className="text-sm text-gray-700">{user.hospital}</span>
                  </div>
                )}

                {/* Address */}
                {user.address && (
                  <div className="flex items-start mb-3">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{user.address}</span>
                  </div>
                )}

                {/* Newsletter */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Newsletter:</span>
                  <span className={`text-sm font-medium ${user.newsletter ? 'text-green-600' : 'text-gray-400'}`}>
                    {user.newsletter ? 'Activée' : 'Désactivée'}
                  </span>
                </div>

                {/* Last Payment or Trial Information */}
                {hasFreeFirstYear(user) && user.activeSubscription ? (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Première année gratuite:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prochain paiement:</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(user.activeSubscription.current_period_end)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Montant:</span>
                        <span className="text-sm font-medium text-blue-600 flex items-center">
                          <Euro className="h-3 w-3 mr-1" />
                          {user.activeSubscription.amount} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut:</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          En période d'essai gratuite
                        </span>
                      </div>
                    </div>
                  </div>
                ) : user.lastPayment ? (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Dernier paiement:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Montant:</span>
                        <span className="text-sm font-medium text-green-600 flex items-center">
                          <Euro className="h-3 w-3 mr-1" />
                          {user.lastPayment.amount} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(user.lastPayment.created)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut:</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          user.lastPayment.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : user.lastPayment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.lastPayment.status === 'succeeded' ? 'Réussi' :
                           user.lastPayment.status === 'pending' ? 'En attente' :
                           'Échoué'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Paiement:</span>
                    </div>
                    <div className="ml-6">
                      <span className="text-sm text-gray-500">Aucun paiement trouvé</span>
                    </div>
                  </div>
                )}

                {/* Creation Date */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Inscrit le {formatDate(user.created_at)}
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(user, e)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Supprimer ce membre"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun membre trouvé avec ces critères de recherche.</p>
          </div>
        )}
      </div>

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
                  Êtes-vous sûr de vouloir supprimer le membre <strong>{deleteConfirmation.user.firstname} {deleteConfirmation.user.lastname}</strong> ({deleteConfirmation.user.email}) ?
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Attention :</strong> Cette action est irréversible. Le membre sera supprimé de la base de données et tous les abonnements Stripe actifs seront annulés.
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