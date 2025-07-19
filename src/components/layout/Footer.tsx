import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { siteContent } from '../../data/content';
import logoSvg from '../../assets/images/logo.svg';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // TODO: Implement newsletter subscription logic
    console.log('Newsletter subscription for:', email);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
      alert('Merci pour votre inscription à notre newsletter !');
    }, 1000);
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center mb-4">
              <img src={logoSvg} alt="SRH Logo" className="h-12 w-auto" />
            </div>
            <p className="text-gray-300 mb-4">
              {siteContent.hero.description}
            </p>
            <div className="text-sm text-gray-400 mb-6">
              <p>{siteContent.contact.address}</p>
              {siteContent.contact.email && (
                <p className="mt-1">{siteContent.contact.email}</p>
              )}
            </div>
            <Link
              to="/jadhere-au-srh"
              className="inline-block bg-srh-pink hover:bg-srh-pink-hover text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              J'adhère au SRH
            </Link>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-300 mb-4 text-sm">
              Restez informé des actualités du syndicat et de la radiologie hospitalière.
            </p>
            <form onSubmit={handleNewsletterSubmit}>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isSubmitting ? 'Inscription...' : "S'inscrire"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Syndicat des Radiologues Hospitaliers. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link
                to="/legal"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/statutes"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Statuts du syndicat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;