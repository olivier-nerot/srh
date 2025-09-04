import React, { useState } from 'react';
import { Mail, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { getUserByEmail } from '../services/userService';
import { useAuthStore } from '../stores/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!isOtpSent) {
        // Step 1: Send OTP
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        });

        const result = await response.json();
        
        if (result.success) {
          setIsOtpSent(true);
        } else {
          setError(result.error || 'Erreur lors de l\'envoi du code');
        }
      } else {
        // Step 2: Verify OTP
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: email.toLowerCase().trim(),
            otp: otp.trim()
          }),
        });

        const result = await response.json();
        
        if (result.success && result.user) {
          // Convert database user to auth user format
          const authUser = {
            id: result.user.id.toString(),
            email: result.user.email,
            firstname: result.user.firstname || '',
            lastname: result.user.lastname || '',
            isadmin: Boolean(result.user.isadmin),
            newsletter: true, // Default value since not returned from login
            hospital: result.user.hospital || '',
            address: '', // Not returned from login for security
            subscription: result.user.subscription || '',
            infopro: '', // Not returned from login for security
          };
          
          // Set user in auth store
          setUser(authUser);
          
          // Navigate to homepage
          navigate('/');
        } else {
          setError(result.error || 'Code invalide');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsOtpSent(false);
    setOtp('');
    setError('');
  };

  const handleBackToEmail = () => {
    setIsOtpSent(false);
    setOtp('');
    setError('');
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
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-srh-blue text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isOtpSent ? 'Entrez votre code' : 'Connexion sécurisée'}
            </h2>
            <p className="text-gray-600">
              {isOtpSent 
                ? `Code envoyé à ${email}` 
                : 'Entrez votre adresse email pour vous connecter'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 rounded-md bg-red-50">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isOtpSent ? (
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
            ) : (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-srh-blue focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Entrez le code à 6 chiffres reçu par email
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={(!email && !isOtpSent) || (isOtpSent && otp.length !== 6) || isLoading}
              className="w-full bg-srh-blue text-white py-3 px-4 rounded-md hover:bg-srh-blue-dark focus:ring-2 focus:ring-offset-2 focus:ring-srh-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isOtpSent ? 'Vérification...' : 'Envoi en cours...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {isOtpSent ? 'Vérifier le code' : 'Envoyer le code'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </button>
          </form>

          {isOtpSent && (
            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-srh-blue hover:text-srh-blue-dark font-medium text-sm"
              >
                Renvoyer le code
              </button>
              <br />
              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Modifier l'adresse email
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="bg-green-100 text-green-800 rounded-full p-1 mr-3 mt-0.5">
                  <Shield className="h-3 w-3" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Connexion par email</p>
                  <p>Un code vous sera envoyé par email</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-800 rounded-full p-1 mr-3 mt-0.5">
                  <Mail className="h-3 w-3" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Accès réservé aux adhérents</p>
                  <p>Seuls les emails enregistrés peuvent se connecter</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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