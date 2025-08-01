import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { siteContent } from '../data/content';
import InfoCard from '../components/ui/InfoCard';
import homepageLeft from '../assets/images/homepage-left.webp';
import homepageRight2 from '../assets/images/homepage-right-2.webp';
import type { NewsItem } from '../types';

interface Publication {
  id: number;
  title: string;
  content: string | null; // Nullable for JO texts
  tags: string[];
  pubdate: string;
  subscribersonly: boolean;
  homepage: boolean;
  picture?: string;
  attachmentIds: number[];
  type: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert Delta JSON to plain text for excerpts
const deltaToPlainText = (content: string | null): string => {
  // Handle null content (e.g., JO texts)
  if (!content) {
    return '';
  }
  
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Extract just the text content without formatting
      return delta.ops.map((op: any) => {
        if (typeof op.insert === 'string') {
          return op.insert.replace(/\n/g, ' ').trim();
        }
        return '';
      }).join('').trim();
    }
  } catch {
    // Parsing failed, treat as plain text and strip HTML tags
    return content.replace(/<[^>]*>/g, '').trim();
  }
  
  // Fallback: strip HTML tags and return plain text
  return content.replace(/<[^>]*>/g, '').trim();
};

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = user !== null;

  useEffect(() => {
    fetchHomepagePublications();
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHomepagePublications = async () => {
    try {
      const response = await fetch('/api/content?contentType=publications');
      const data = await response.json();
      if (data.success) {
        // Filter publications that should appear on homepage
        let homepagePublications = data.publications.filter((pub: Publication) => pub.homepage);
        
        // If user is not logged in, exclude subscriber-only publications
        if (!isLoggedIn) {
          homepagePublications = homepagePublications.filter((pub: Publication) => !pub.subscribersonly);
        }
        
        setPublications(homepagePublications);
      }
    } catch (error) {
      console.error('Error fetching homepage publications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform database publication to NewsItem format for InfoCard
  const transformToNewsItem = (publication: Publication): NewsItem => {
    const plainTextContent = deltaToPlainText(publication.content);
    
    return {
      id: publication.id.toString(),
      title: publication.title,
      excerpt: plainTextContent.length > 200 
        ? `${plainTextContent.substring(0, 200)}...` 
        : plainTextContent,
      content: publication.content,
      publishedAt: publication.pubdate,
      slug: `publication-${publication.id}`,
      category: publication.type === 'newsletter' ? 'Newsletter' as const
               : publication.type === 'communique' ? 'Communiqué' as const
               : 'Publication' as const,
    };
  };
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
                <button type="button" className="bg-white text-srh-blue hover:bg-blue-50 px-8 py-3 rounded-md font-medium transition-colors">
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4" />
              <p className="text-gray-600">Chargement des actualités...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publications.map((publication) => {
                  const article = transformToNewsItem(publication);
                  return (
                    <InfoCard 
                      key={publication.id} 
                      article={article} 
                      image={publication.picture}
                    />
                  );
                })}
              </div>

              {publications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucune actualité disponible pour le moment.</p>
                </div>
              )}
            </>
          )}

          <div className="text-center mt-8 space-x-4">
            <Link 
              to="/content?type=publication"
              className="inline-block border-2 border-srh-blue text-srh-blue hover:bg-srh-blue hover:text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Voir nos publications
            </Link>
            <Link 
              to="/content?type=communique"
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