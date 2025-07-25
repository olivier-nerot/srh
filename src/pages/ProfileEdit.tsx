import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Save, Briefcase, AlertCircle 
} from 'lucide-react';
import { getUserById } from '../services/userService';
import { useAuthStore } from '../stores/authStore';

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
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal');

  const userId = searchParams.get('id');

  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: '',
    hospital: '',
    address: '',
    subscription: '',
    newsletter: true,
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
    },
    {
      id: 'retired',
      title: 'Radiologue hospitalier/universitaire retraité',
    },
    {
      id: 'assistant',
      title: 'Radiologue assistant spécialiste',
    },
    {
      id: 'first-time',
      title: 'Première adhésion (dans l\'année de nomination)',
    }
  ];

  const professionalFields = [
    { key: 'huTitulaire', label: 'HU titulaire' },
    { key: 'phLiberal', label: 'PH Libéral' },
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
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const user = await getUserById(userId);
      if (user) {
        setUserProfile(user);
        
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError('');

    try {
      // Prepare professional info
      const professionalInfo = {
        huTitulaire: formData.huTitulaire,
        phLiberal: formData.phLiberal,
        hospitaloUniversitaireTitulaire: formData.hospitaloUniversitaireTitulaire,
        adhesionCollegiale: formData.adhesionCollegiale,
        huLiberal: formData.huLiberal,
        hospitaloUniversitaireCCA: formData.hospitaloUniversitaireCCA,
        adhesionAlliance: formData.adhesionAlliance,
        assistantSpecialiste: formData.assistantSpecialiste,
        assistantTempsPartage: formData.assistantTempsPartage,
      };

      // Call update API
      const response = await fetch(`/api/update-profile?id=${userId}`, {
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
          infopro: JSON.stringify(professionalInfo),
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

  return (
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
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
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
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'professional'
                      ? 'border-srh-blue text-srh-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Briefcase className="h-5 w-5 mr-2 inline" />
                  Informations Professionnelles
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;