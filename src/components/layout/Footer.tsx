import React from 'react';
import { Link } from 'react-router-dom';
import { siteContent } from '../../data/content';
import logoSvg from '../../assets/images/logo.svg';

const Footer: React.FC = () => {

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo and Address */}
          <div>
            <div className="flex items-center mb-4">
              <img src={logoSvg} alt="SRH Logo" className="h-12 w-auto" />
            </div>
            <div className="text-sm text-gray-400">
              <p>{siteContent.contact.address}</p>
              {siteContent.contact.email && (
                <p className="mt-1">{siteContent.contact.email}</p>
              )}
            </div>
          </div>

          {/* Text and Button */}
          <div>
            <p className="text-gray-300 mb-6">
              {siteContent.hero.description}
            </p>
            <Link
              to="/jadhere-au-srh"
              className="inline-block bg-srh-pink hover:bg-srh-pink-hover text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              J'adhère au SRH
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Syndicat des Radiologues Hospitaliers. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                to="/statuts"
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