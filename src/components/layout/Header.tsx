import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { siteContent } from '../../data/content';
import logoSvg from '../../assets/images/logo.svg';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src={logoSvg} alt="SRH Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {siteContent.navigation.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.title)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.href}
                  className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.title}
                  {item.children && <ChevronDown className="ml-1 h-4 w-4" />}
                </Link>

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.title && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.title}
                          to={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons - Match original design */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/jadhere-au-srh"
              className="bg-srh-pink hover:bg-srh-pink-hover text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              J'adhère au SRH
            </Link>
            <Link
              to="/login"
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Espace adhérent
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 p-2 rounded-md"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {siteContent.navigation.map((item) => (
                <div key={item.title}>
                  <Link
                    to={item.href}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                  >
                    {item.title}
                  </Link>
                  {item.children && (
                    <div className="pl-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.title}
                          to={child.href}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 space-y-2">
                <Link
                  to="/jadhere-au-srh"
                  className="block w-full bg-srh-pink hover:bg-srh-pink-hover text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                >
                  J'adhère au SRH
                </Link>
                <Link
                  to="/login"
                  className="block w-full bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                >
                  Espace adhérent
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;