import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';

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

  // Helper function to extract year from publication date
  const getPublicationYear = (pubdate: string): string => {
    const date = new Date(parseInt(pubdate));
    return date.getFullYear().toString();
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

  // Group publications by year
  const publicationsByYear = filteredPublications.reduce((acc, pub) => {
    const year = getPublicationYear(pub.pubdate);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(pub);
    return acc;
  }, {} as Record<string, Publication[]>);

  // Sort years in descending order
  const sortedYears = Object.keys(publicationsByYear).sort((a, b) => parseInt(b) - parseInt(a));


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
          // Extract all unique tags from filtered publications, excluding year tags, and sort alphabetically
          const availableTags = Array.from(
            new Set(
              filteredPublications
                .flatMap(pub => pub.tags || [])
                .filter(tag => tag && tag.trim().length > 0)
                .filter(tag => !/^\d{4}$/.test(tag)) // Exclude year tags (4-digit numbers)
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

        {/* Publications grouped by year */}
        {filteredPublications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">
              {publications.length === 0 
                ? config.emptyMessage
                : "Aucun élément ne correspond aux tags sélectionnés."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <div key={year}>
                {/* Year separator */}
                <div className="flex items-center mb-6">
                  <div className="flex-grow h-px bg-gray-300"></div>
                  <h2 className="px-4 text-2xl font-bold text-gray-800">{year}</h2>
                  <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                
                {/* Publications grid for this year */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {publicationsByYear[year].map((publication) => {
                    // Convert Delta content to plain text for excerpt
                    const plainTextContent = deltaToPlainText(publication.content);
                    
                    // Filter out year tags from display
                    const nonYearTags = (publication.tags || []).filter(tag => !/^\d{4}$/.test(tag));
                    
                    return (
                      <div key={publication.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Image */}
                        {publication.picture && (
                          <div className="aspect-video bg-gray-200">
                            <img 
                              src={publication.picture} 
                              alt={publication.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="p-6">
                          {/* Header with title and download icon */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                              {publication.title}
                            </h3>
                            {publication.attachmentIds && publication.attachmentIds.length > 0 && (
                              <button
                                onClick={() => {
                                  // TODO: Implement download functionality for first attachment
                                  console.log('Download attachment:', publication.attachmentIds[0]);
                                }}
                                className="ml-2 p-1 text-gray-400 hover:text-srh-blue transition-colors"
                                title="Télécharger le document"
                              >
                                <Download size={20} />
                              </button>
                            )}
                          </div>
                          
                          {/* Year and category */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                              {year}
                            </span>
                            <span className="px-2 py-1 bg-srh-blue/10 text-srh-blue text-sm rounded-full">
                              {config.category}
                            </span>
                          </div>
                          
                          {/* Excerpt */}
                          {plainTextContent && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {plainTextContent.length > 150 
                                ? plainTextContent.substring(0, 150) + '...' 
                                : plainTextContent}
                            </p>
                          )}
                          
                          {/* Tags */}
                          {nonYearTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {nonYearTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border"
                                >
                                  {tag}
                                </span>
                              ))}
                              {nonYearTags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border">
                                  +{nonYearTags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Read more link */}
                          <button
                            onClick={() => {
                              window.location.href = `/item?id=${publication.id}&type=${contentType}`;
                            }}
                            className="text-srh-blue hover:text-srh-blue-dark font-medium text-sm"
                          >
                            Lire la suite →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Publications;