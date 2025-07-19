import React, { useState } from 'react';
import { Users, Euro, FileText, CheckCircle, User, Briefcase, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51...');

const JadhereAuSrh: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'payment'>('personal');
  
  // Form data state
  const [formData, setFormData] = useState({
    // Personal information
    firstName: '',
    lastName: '',
    email: '',
    hospital: '',
    address: '',
    
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
    
    terms: false
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

  const benefits = [
    'Soutien d\'Alliance-Hôpital',
    'Participation à l\'assemblée générale annuelle',
    'Amélioration de la représentation de l\'exercice hospitalier',
    'Réception de la newsletter du syndicat',
    'Conseils professionnels et soutien juridique'
  ];

  const tabs = [
    { id: 'personal', label: 'Informations Personnelles', icon: User },
    { id: 'professional', label: 'Informations Professionnelles', icon: Briefcase },
    { id: 'payment', label: 'Règlement', icon: CreditCard }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const isTabValid = (tabId: string) => {
    switch (tabId) {
      case 'personal':
        return formData.firstName && formData.lastName && formData.email && formData.hospital;
      case 'professional':
        return true; // Professional info is optional
      case 'payment':
        return formData.terms;
      default:
        return false;
    }
  };


  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const PaymentForm: React.FC<{ selectedTier: any }> = ({ selectedTier }) => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Récapitulatif de votre adhésion</h4>
          <div className="flex justify-between items-center">
            <span>{selectedTier.title}</span>
            <span className="font-bold">
              {selectedTier.price === 0 ? 'Gratuit' : `${selectedTier.price} €`}
            </span>
          </div>
          {selectedTier.price > 0 && (
            <div className="text-sm text-green-600 mt-1">
              Coût réel après déduction fiscale : {selectedTier.actualCost} €
            </div>
          )}
        </div>

        {selectedTier.price > 0 && (
          <div>
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
                  },
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            checked={formData.terms}
            onChange={handleInputChange}
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="/statuts" className="text-blue-600 hover:text-blue-700">
              statuts du syndicat
            </a>{' '}
            et souhaite adhérer au SRH *
          </label>
        </div>
      </div>
    );
  };

  const handlePayment = async () => {
    
    setIsPaymentLoading(true);

    try {
      // Here you would typically create a payment intent on your backend
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Adhésion finalisée avec succès !');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">J'adhère au SRH</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rejoignez le Syndicat des Radiologues Hospitaliers et bénéficiez d'un soutien professionnel 
            et d'une représentation forte dans le milieu hospitalier.
          </p>
        </div>

        {/* Tax Deduction Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <Euro className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Avantage fiscal</h3>
              <p className="text-green-800">
                <strong>66% de votre cotisation est déductible de vos impôts.</strong> 
                Le coût réel après déduction fiscale est considérablement réduit.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Membership Tiers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez votre type d'adhésion</h2>
            
            <div className="space-y-4">
              {membershipTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedTier === tier.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={tier.id}
                          name="membershipTier"
                          value={tier.id}
                          checked={selectedTier === tier.id}
                          onChange={() => setSelectedTier(tier.id)}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{tier.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-3">{tier.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {tier.price === 0 ? 'Gratuit' : `${tier.price} €`}
                      </div>
                      {tier.price > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Coût réel: {tier.actualCost} € (après déduction fiscale)
                        </div>
                      )}
                      <div className="text-sm text-gray-500">par an</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabbed Membership Form */}
            {selectedTier && (
              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex w-full">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      isTabValid(tab.id);
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`group inline-flex items-center justify-center py-2 px-1 border-b-2 font-medium text-sm flex-1 ${
                            isActive
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`mr-2 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {/* Personal Information Tab */}
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900">Informations Personnelles</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                            Nom *
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex justify-between pt-6">
                        <Button
                          disabled={true}
                          variant="outline"
                          className="opacity-50 cursor-not-allowed"
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setActiveTab('professional')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Professional Information Tab */}
                  {activeTab === 'professional' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900">Informations Professionnelles</h3>
                      <p className="text-gray-600">Cochez les cases correspondant à votre situation professionnelle :</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'huTitulaire', label: 'HU titulaire' },
                          { key: 'phLiberal', label: 'PH Libéral' },
                          { key: 'hospitaloUniversitaireTitulaire', label: 'Hospitalo-Universitaire titulaire' },
                          { key: 'adhesionCollegiale', label: 'Adhésion conjointe à la collégiale de l\'AP-HP' },
                          { key: 'huLiberal', label: 'HU Libéral' },
                          { key: 'hospitaloUniversitaireCCA', label: 'Hospitalo-Universitaire (CCA, AHU, PHU)' },
                          { key: 'adhesionAlliance', label: 'Adhésion conjointe à Alliance Hôpital' },
                          { key: 'assistantSpecialiste', label: 'Assistant spécialiste hospitalier' },
                          { key: 'assistantTempsPartage', label: 'Assistant temps partagé' }
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={item.key}
                              name={item.key}
                              checked={formData[item.key as keyof typeof formData] as boolean}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={item.key} className="text-sm text-gray-700">
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between pt-6">
                        <Button
                          onClick={() => setActiveTab('personal')}
                          variant="outline"
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setActiveTab('payment')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Payment Tab */}
                  {activeTab === 'payment' && (
                    <Elements stripe={stripePromise}>
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900">Règlement</h3>
                        
                        <PaymentForm selectedTier={membershipTiers.find(tier => tier.id === selectedTier)} />

                        <div className="flex justify-between items-center pt-6">
                          <Button
                            onClick={() => setActiveTab('professional')}
                            variant="outline"
                          >
                            Précédent
                          </Button>
                          
                          <Button 
                            onClick={handlePayment}
                            size="lg" 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!formData.terms || isPaymentLoading}
                          >
                            {isPaymentLoading 
                              ? 'Traitement en cours...' 
                              : membershipTiers.find(tier => tier.id === selectedTier)?.price === 0 
                                ? 'Finaliser mon adhésion gratuite' 
                                : 'Finaliser mon adhésion et payer'
                            }
                          </Button>

                          <Button
                            disabled={true}
                            variant="outline"
                            className="opacity-50 cursor-not-allowed"
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </Elements>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Benefits Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <Users className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Avantages de l'adhésion</h3>
                </div>
                
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-6 w-6 text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                </div>
                
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Adresse :</strong></p>
                  <p>
                    15 rue Ferdinand Duval<br />
                    75004 PARIS
                  </p>
                  
                  <div className="pt-4">
                    <a
                      href="/contactez-nous"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      → Contactez-nous pour plus d'informations
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JadhereAuSrh;