import React from 'react';
import { Link } from 'react-router-dom';
import { siteContent } from '../data/content';
import InfoCard from '../components/ui/InfoCard';
import homepageLeft from '../assets/images/homepage-left.webp';
import homepageRight2 from '../assets/images/homepage-right-2.webp';

// News article images
import newsArticle1 from '../assets/images/news-article-1.jpg';
import newsArticle2 from '../assets/images/news-article-2.jpg';
import newsArticle3 from '../assets/images/news-article-3.jpg';
import newsArticle4 from '../assets/images/news-article-4.jpg';
import newsArticle5 from '../assets/images/news-article-5.jpg';
import newsArticle6 from '../assets/images/news-article-6.jpg';

const newsImages: { [key: string]: string } = {
  'news-article-1.jpg': newsArticle1,
  'news-article-2.jpg': newsArticle2,
  'news-article-3.jpg': newsArticle3,
  'news-article-4.jpg': newsArticle4,
  'news-article-5.jpg': newsArticle5,
  'news-article-6.jpg': newsArticle6,
};

const HomePage: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* Hero Section - Full background image */}
      <section 
        className="relative py-20 text-white max-h-[60vh] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 51, 102, 0.7), rgba(0, 102, 204, 0.7)), url(${homepageLeft})`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-center lg:justify-end h-full min-h-[60vh]">
            {/* Content positioned on the right */}
            <div className="text-center lg:text-left max-w-lg">
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
      </section>

      {/* Actualités Section - matching original card layout */}
      <section className="py-16 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre actualité
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {siteContent.news.slice(0, 6).map((article) => (
              <InfoCard 
                key={article.id} 
                article={article} 
                image={article.image && newsImages[article.image] ? newsImages[article.image] : undefined}
              />
            ))}
          </div>

          <div className="text-center mt-8 space-x-4">
            <Link 
              to="/publications"
              className="inline-block border-2 border-srh-blue text-srh-blue hover:bg-srh-blue hover:text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Voir nos publications
            </Link>
            <Link 
              to="/communiques"
              className="inline-block border-2 border-srh-blue text-srh-blue hover:bg-srh-blue hover:text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Voir nos communiqués
            </Link>
          </div>
        </div>
      </section>

      {/* Job Offers Section - matching original design */}
      <section className="py-16 bg-white relative overflow-hidden">
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
              <div className="bg-gray-50 text-gray-900 rounded-lg p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-srh-blue">
                  Les offres de postes 2025
                </h2>
                <p className="text-gray-700 mb-6">
                  Vous trouverez la liste complémentaire des vacances de postes de praticiens hospitaliers dans les établissements publics de santé et les établissements médico-sociaux au 1er avril 2025.
                </p>
                <a
                  href="https://www.cng.sante.fr/praticiens-hospitaliers/praticiens-enseignants-hospitaliers/competences-relevant-cng/tours-recrutement-2025"
                  className="inline-block bg-srh-blue hover:bg-srh-blue-dark text-white px-6 py-3 rounded-md font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir plus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;