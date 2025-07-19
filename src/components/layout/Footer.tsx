import React from 'react';
import { Link } from 'react-router-dom';
import { siteContent } from '../../data/content';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold">SRH</span>
            </div>
            <p className="text-gray-300 mb-4">
              {siteContent.hero.description}
            </p>
            <div className="text-sm text-gray-400">
              <p>{siteContent.contact.address}</p>
              {siteContent.contact.phone && (
                <p className="mt-1">{siteContent.contact.phone}</p>
              )}
              {siteContent.contact.email && (
                <p className="mt-1">{siteContent.contact.email}</p>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              {siteContent.navigation.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.title}
                  </Link>
                  {item.children && (
                    <ul className="ml-4 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.title}>
                          <Link
                            to={child.href}
                            className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Espace membre</h3>
            <div className="space-y-3">
              <Link
                to="/join"
                className="block bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium text-center hover:bg-primary-700 transition-colors"
              >
                J'adhère au SRH
              </Link>
              <Link
                to="/member-area"
                className="block border border-gray-600 text-gray-300 px-4 py-2 rounded-md text-sm font-medium text-center hover:bg-gray-800 transition-colors"
              >
                Espace adhérent
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
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