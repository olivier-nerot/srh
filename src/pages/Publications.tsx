import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import InfoCard from '../components/ui/InfoCard';

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
  type: 'publication' | 'communique' | 'jo' | 'rapport';
  createdAt: string;
  updatedAt: string;
}

// Content type configuration
const CONTENT_TYPES = {
  publication: {
    title: 'Nos publications',
    subtitle: 'Newsletters et publications du SRH',
    emptyMessage: 'Aucune publication disponible pour le moment.',
    category: 'Publication' as const
  },
  communique: {
    title: 'Communiqués',
    subtitle: 'Communiqués de presse et positions du SRH',
    emptyMessage: 'Aucun communiqué disponible pour le moment.',
    category: 'Communiqué' as const
  },
  jo: {
    title: 'Journal Officiel',
    subtitle: 'Textes du Journal Officiel',
    emptyMessage: 'Aucun texte du Journal Officiel disponible pour le moment.',
    category: 'Journal Officiel' as const
  },
  rapport: {
    title: 'Rapports institutionnels',
    subtitle: 'Rapports et études du SRH',
    emptyMessage: 'Aucun rapport disponible pour le moment.',
    category: 'Rapport' as const
  }
};


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
      return delta.ops.map((op: { insert?: string }) => {
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



const Publications: React.FC = () => {
  const [searchParams] = useSearchParams();
  const contentType = (searchParams.get('type') as keyof typeof CONTENT_TYPES) || 'publication';
  const config = CONTENT_TYPES[contentType];
  
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/content?contentType=publications&type=${contentType}`);
        const data = await response.json();
        if (data.success) {
          setPublications(data.publications);
        }
      } catch (error) {
        console.error(`Error fetching ${contentType}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [contentType]);



  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Filter publications based on selected tags (only show homepage publications for public)
  const filteredPublications = selectedTags.length === 0 
    ? publications.filter(pub => pub.homepage)
    : publications
        .filter(pub => pub.homepage)
        .filter(pub => 
          selectedTags.some(selectedTag => 
            pub.tags && pub.tags.includes(selectedTag)
          )
        );


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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.title}</h1>
              <p className="text-xl opacity-90">{config.subtitle}</p>
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

        {/* Public View - InfoCard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPublications.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">
                {publications.length === 0 
                  ? config.emptyMessage
                  : "Aucun élément ne correspond aux tags sélectionnés."
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
                slug: `${contentType}-${publication.id}`,
                category: config.category,
                contentType: contentType,
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
        </div>
      </div>
    </>
  );
};

export default Publications;