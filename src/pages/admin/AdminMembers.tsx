import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Building2, MapPin, Calendar, Settings, Search, Filter, Briefcase } from 'lucide-react';
import { getAllUsers } from '../../services/userService';

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
}

const AdminMembers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error || 'Erreur lors du chargement des membres');
      }
    } catch (err) {
      setError('Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.hospital?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterSubscription === 'all' || user.subscription === filterSubscription;
    
    return matchesSearch && matchesFilter;
  });

  const getSubscriptionLabel = (subscription: string) => {
    const subscriptions: { [key: string]: string } = {
      'practicing': 'Médecin hospitalier en exercice',
      'retired': 'Radiologue retraité',
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

  const handleUserClick = (userId: number) => {
    navigate(`/profile?id=${userId}`);
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
        'phLiberal': 'PH Libéral',
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterSubscription}
                  onChange={(e) => setFilterSubscription(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Tous les types d'adhésion</option>
                  <option value="practicing">Médecin en exercice</option>
                  <option value="retired">Retraité</option>
                  <option value="assistant">Assistant spécialiste</option>
                  <option value="first-time">Première adhésion</option>
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
                    <div className="flex items-center mt-1">
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

                {/* Creation Date */}
                <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  Inscrit le {formatDate(user.created_at)}
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
    </div>
  );
};

export default AdminMembers;