import React, { useState } from 'react';
import { Mail, ArrowRight, Shield } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Espace adhérent</h1>
            <p className="text-xl opacity-90">Accédez à votre espace personnel sécurisé</p>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isSubmitted ? (
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-srh-blue text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion sécurisée</h2>
              <p className="text-gray-600">
                Entrez votre adresse email pour recevoir un code de connexion temporaire
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Utilisez l'adresse email associée à votre adhésion SRH
                </p>
              </div>

              <button
                type="submit"
                disabled={!email || isLoading}
                className="w-full bg-srh-blue text-white py-3 px-4 rounded-md hover:bg-srh-blue-dark focus:ring-2 focus:ring-offset-2 focus:ring-srh-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Recevoir le code de connexion
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="bg-green-100 text-green-800 rounded-full p-1 mr-3 mt-0.5">
                    <Shield className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Connexion sécurisée par OTP</p>
                    <p>Un code temporaire sera envoyé à votre email</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-3 mt-0.5">
                    <Mail className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pas de mot de passe</p>
                    <p>Système d'authentification simplifié et sécurisé</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-lg p-8 text-center">
            <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email envoyé !</h2>
            <p className="text-gray-600 mb-6">
              Un code de connexion a été envoyé à l'adresse :<br />
              <strong className="text-gray-900">{email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Vérifiez votre boîte de réception (et vos spams) puis cliquez sur le lien 
                de connexion reçu par email.
              </p>
            </div>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="text-srh-blue hover:text-srh-blue-dark font-medium"
            >
              Renvoyer un code
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Pas encore adhérent ?{' '}
            <a href="/jadhere-au-srh" className="text-srh-blue hover:text-srh-blue-dark font-medium">
              Rejoignez le SRH
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;