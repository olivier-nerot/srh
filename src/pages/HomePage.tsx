import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { siteContent } from '../data/content';
import homepageLeft from '../assets/images/homepage-left.webp';
import homepageRight1 from '../assets/images/homepage-right-1.webp';
import homepageRight2 from '../assets/images/homepage-right-2.webp';
import homepageRight3 from '../assets/images/homepage-right-3.webp';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* Hero Section - Recreate original design exactly */}
      <section className="relative py-20 text-white bg-gradient-to-br from-srh-blue to-srh-blue-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
            {/* Left - Brain Image */}
            <div className="order-2 lg:order-1 relative">
              <img 
                src={homepageLeft} 
                alt="Radiologie Hospitalière - Cerveau"
                className="w-full h-auto max-w-lg mx-auto"
              />
            </div>
            
            {/* Right - Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {siteContent.hero.title}
              </h1>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                {siteContent.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-white text-srh-blue hover:bg-blue-50 px-8 py-3 rounded-md font-medium transition-colors">
                  Nous découvrir
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side images positioned on the blue background */}
        <div className="absolute bottom-8 right-8 hidden lg:flex gap-4">
          <img 
            src={homepageRight1} 
            alt="Radiologie 1"
            className="w-24 h-24 rounded-lg shadow-lg object-cover"
          />
          <img 
            src={homepageRight2} 
            alt="Radiologie 2"
            className="w-24 h-24 rounded-lg shadow-lg object-cover"
          />
          <img 
            src={homepageRight3} 
            alt="Radiologie 3"
            className="w-24 h-24 rounded-lg shadow-lg object-cover"
          />
        </div>
      </section>

      {/* Actualités Section - matching original card layout */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              actualités
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {siteContent.news.slice(0, 4).map((article) => (
              <article key={article.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <time className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                    </time>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {article.excerpt}
                  </p>
                  <Link 
                    to={`/news/${article.slug}`}
                    className="text-srh-blue hover:text-srh-blue-dark font-medium text-sm inline-flex items-center"
                  >
                    Lire plus
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/nos-informations"
              className="inline-block border-2 border-srh-blue text-srh-blue hover:bg-srh-blue hover:text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Voir nos informations
            </Link>
          </div>
        </div>
      </section>

      {/* Job Offers Section - matching original design */}
      <section className="py-16 bg-gray-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <div className="order-2 lg:order-1">
              <img 
                src={homepageRight2} 
                alt="Medical Professional"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            {/* Right - Content */}
            <div className="order-1 lg:order-2">
              <div className="bg-white text-gray-900 rounded-lg p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-srh-blue">
                  Les offres de postes 2024
                </h2>
                <p className="text-gray-700 mb-6">
                  Vous trouverez la liste complémentaire des vacances de postes de praticiens hospitaliers dans les établissements publics de santé et les établissements médico-sociaux au 1er avril 2024.
                </p>
                <Link 
                  to="/jobs"
                  className="inline-block bg-srh-blue hover:bg-srh-blue-dark text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  Voir plus
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;