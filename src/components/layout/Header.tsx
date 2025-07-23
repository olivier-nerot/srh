import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, User, LogOut, FileText, HelpCircle, Users, Newspaper, File, Send, Mail, 
         Building2, UserCheck, ScrollText, BookOpen, MessageCircle, Scale, FileBarChart } from 'lucide-react';
import { siteContent } from '../../data/content';
import { useAuthStore } from '../../stores/authStore';
import logoSvg from '../../assets/images/logo.svg';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = (itemTitle: string) => {
    setActiveDropdown(activeDropdown === itemTitle ? null : itemTitle);
  };

  const handleDropdownItemClick = () => {
    setActiveDropdown(null);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const userMenuItems = [
    { label: 'Mon profil', href: '/profile', icon: User },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'FAQ', href: '/faq', icon: HelpCircle },
  ];

  const adminMenuItems = [
    { label: 'Membres', href: '/admin/members', icon: Users },
    { label: 'Actualité', href: '/admin/news', icon: Newspaper },
    { label: 'Publications', href: '/admin/publications', icon: File },
    { label: 'Communiqués', href: '/admin/communiques', icon: Send },
    { label: 'Newsletters', href: '/admin/newsletters', icon: Mail },
  ];

  // Icons mapping for navigation items
  const getNavigationIcon = (title: string) => {
    const iconMap: { [key: string]: any } = {
      // Qui sommes-nous
      'Présentation': Building2,
      'Bureau': UserCheck,
      'Les statuts': ScrollText,
      
      // Nos informations
      'Nos publications': BookOpen,
      'Communiqués': MessageCircle,
      
      // Textes officiels
      'Textes du Journal Officiel': Scale,
      'Rapports institutionnels': FileBarChart,
    };
    
    return iconMap[title] || FileText; // Default icon
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={headerRef}>
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
              <div key={item.title} className="relative">
                {item.children ? (
                  <>
                    <button
                      onClick={() => handleDropdownToggle(item.title)}
                      className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors focus:outline-none"
                    >
                      {item.title}
                      <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${activeDropdown === item.title ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === item.title && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white/80 backdrop-blur-md rounded-md shadow-lg border z-50">
                        <div className="py-1">
                          {item.children.map((child) => {
                            const IconComponent = getNavigationIcon(child.title);
                            return (
                              <Link
                                key={child.title}
                                to={child.href}
                                onClick={handleDropdownItemClick}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                              >
                                <IconComponent className="h-4 w-4 mr-3" />
                                {child.title}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* User Menu or CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={handleUserMenuToggle}
                  className="bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{user.firstname} {user.lastname}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white/80 backdrop-blur-md rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            to={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            {item.label}
                          </Link>
                        );
                      })}
                      
                      {user.isadmin && (
                        <>
                          <div className="border-t border-red-200 my-1"></div>
                          <div className="px-4 py-1">
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Zone Admin</span>
                          </div>
                          {adminMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.label}
                                to={item.href}
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 border-l-2 border-red-200 hover:border-l-red-400"
                              >
                                <Icon className="h-4 w-4 mr-3 text-red-600" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </>
                      )}
                      
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/jadhere-au-srh"
                  className="bg-srh-pink hover:bg-srh-pink-hover text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  J'adhère au SRH
                </Link>
                <Link
                  to="/login"
                  className="bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </>
            )}
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
                  {item.children ? (
                    <>
                      <button
                        onClick={() => handleDropdownToggle(item.title)}
                        className="w-full text-left flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                      >
                        {item.title}
                        <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.title ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === item.title && (
                        <div className="ml-4 mt-2 bg-white/80 backdrop-blur-md rounded-md border shadow-sm">
                          <div className="py-1 space-y-1">
                            {item.children.map((child) => {
                              const IconComponent = getNavigationIcon(child.title);
                              return (
                                <Link
                                  key={child.title}
                                  to={child.href}
                                  onClick={() => {
                                    handleDropdownItemClick();
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md mx-1"
                                >
                                  <IconComponent className="h-4 w-4 mr-3" />
                                  {child.title}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
              <div className="pt-4 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
                      {user.firstname} {user.lastname}
                    </div>
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.label}
                        </Link>
                      );
                    })}
                    
                    {user.isadmin && (
                      <>
                        <div className="border-t border-red-200 my-2"></div>
                        <div className="px-3 py-1">
                          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Zone Admin</span>
                        </div>
                        {adminMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center px-3 py-2 text-sm text-red-700 hover:text-red-800 hover:bg-red-50 rounded-md border-l-2 border-red-200 hover:border-l-red-400 ml-2"
                            >
                              <Icon className="h-4 w-4 mr-3 text-red-600" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </>
                    )}
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/jadhere-au-srh"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-srh-pink hover:bg-srh-pink-hover text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                    >
                      J'adhère au SRH
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors flex items-center justify-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Login</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;