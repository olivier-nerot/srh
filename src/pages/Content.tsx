import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { FileText, Megaphone, Mail } from 'lucide-react';
import InfoCard from '../components/ui/InfoCard';

interface Publication {
  id: number;
  title: string;
  content: string;
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
const deltaToPlainText = (content: string): string => {
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

// Helper component to display tag chips
const TagChips: React.FC<{ tags: string[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-srh-blue text-white"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

const Content: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get type from URL parameter, default to 'publication'
  const type = searchParams.get('type') || 'publication';

  const isAdmin = user?.isadmin === true;

  useEffect(() => {
    fetchPublications();
  }, [type]);

  const fetchPublications = async () => {
    try {
      const response = await fetch(`/api/publications?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setPublications(data.publications);
      }
    } catch (error) {
      console.error('Error fetching publications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Filter publications based on selected tags and homepage visibility
  const filteredPublications = selectedTags.length === 0 
    ? publications.filter(pub => pub.homepage)
    : publications
        .filter(pub => pub.homepage)
        .filter(pub => 
          selectedTags.some(selectedTag => 
            pub.tags && pub.tags.includes(selectedTag)
          )
        );

  // Get page configuration based on type
  const getPageConfig = (type: string) => {
    switch (type) {
      case 'communique':
        return {
          title: 'Communiqués',
          subtitle: 'Communiqués de presse et positions du SRH',
          icon: Megaphone,
          iconColor: 'text-red-600',
          subscriptionText: 'Inscrivez-vous pour recevoir nos communiqués directement dans votre boîte mail.'
        };
      case 'newsletter':
        return {
          title: 'Newsletters',
          subtitle: 'Newsletters et informations du SRH',
          icon: Mail,
          iconColor: 'text-green-600',
          subscriptionText: 'Inscrivez-vous pour recevoir nos newsletters directement dans votre boîte mail.'
        };
      default: // publication
        return {
          title: 'Nos publications',
          subtitle: 'Publications et documents du SRH',
          icon: FileText,
          iconColor: 'text-blue-600',
          subscriptionText: 'Inscrivez-vous pour recevoir nos publications directement dans votre boîte mail.'
        };
    }
  };

  const pageConfig = getPageConfig(type);
  const PageIcon = pageConfig.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du contenu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageConfig.title}</h1>
              <p className="text-xl opacity-90">{pageConfig.subtitle}</p>
            </div>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

        {/* All Tags List */}
        {publications.length > 0 && (() => {
          // Extract all unique tags from filtered publications and sort alphabetically
          const availableTags = Array.from(
            new Set(
              filteredPublications
                .flatMap(pub => pub.tags || [])
                .filter(tag => tag && tag.trim().length > 0)
            )
          ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          
          if (availableTags.length === 0) return null;
          
          return (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Tags {selectedTags.length > 0 && `(${selectedTags.length} sélectionné${selectedTags.length > 1 ? 's' : ''})`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagFilter(tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-srh-blue text-white border-srh-blue hover:bg-srh-blue-dark'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Effacer tous les filtres
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPublications.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">
                {publications.length === 0 
                  ? `Aucun contenu disponible pour le moment.` 
                  : "Aucun contenu ne correspond aux tags sélectionnés."
                }
              </p>
            </div>
          ) : (
            filteredPublications.map((publication) => {
              // Convert Delta content to plain text for excerpt
              const plainTextContent = deltaToPlainText(publication.content);
              
              // Convert publication to NewsItem format for InfoCard
              const newsItem = {
                id: publication.id.toString(),
                title: publication.title,
                excerpt: plainTextContent.length > 200 
                  ? plainTextContent.substring(0, 200) + '...' 
                  : plainTextContent,
                content: publication.content,
                publishedAt: publication.pubdate,
                slug: `publication-${publication.id}`,
                category: publication.type === 'newsletter' ? 'Newsletter' as const 
                         : publication.type === 'communique' ? 'Communiqué' as const 
                         : 'Publication' as const,
              };
              
              return (
                <InfoCard 
                  key={publication.id} 
                  article={newsItem}
                  image={publication.picture}
                />
              );
            })
          )}
        </div>

        {/* Newsletter Subscription */}
        <section className="bg-blue-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restez informé</h2>
          <p className="text-gray-700 mb-6">
            {pageConfig.subscriptionText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              S'inscrire
            </button>
          </div>
        </section>
        </div>
      </div>
    </>
  );
};

export default Content;