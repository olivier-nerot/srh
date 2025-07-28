import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Calendar, Tag } from 'lucide-react';

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
    title: 'Publication',
    color: 'blue'
  },
  communique: {
    title: 'Communiqué',
    color: 'green'
  },
  jo: {
    title: 'Journal Officiel',
    color: 'purple'
  },
  rapport: {
    title: 'Rapport',
    color: 'orange'
  }
};

// Helper function to render Delta JSON content
const renderContent = (content: string | null): React.ReactNode => {
  // Handle null content (e.g., JO texts without content)
  if (!content) {
    return (
      <div className="text-gray-500 italic">
        Ce document ne contient que le titre. Consultez le document original via les liens disponibles.
      </div>
    );
  }
  
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Convert Delta ops to simple HTML string first
      const html = delta.ops.map((op: { insert?: string; attributes?: Record<string, unknown> }) => {
        if (typeof op.insert === 'string') {
          let text = op.insert;
          
          // Apply basic formatting
          if (op.attributes) {
            const attrs = op.attributes as Record<string, unknown>;
            if (attrs.bold) text = `<strong>${text}</strong>`;
            if (attrs.italic) text = `<em>${text}</em>`;
            if (attrs.underline) text = `<u>${text}</u>`;
            if (attrs.link) text = `<a href="${attrs.link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
            if (attrs.header) text = `<h${attrs.header} class="font-bold my-4">${text}</h${attrs.header}>`;
          }
          
          // Convert newlines to br tags
          text = text.replace(/\n/g, '<br>');
          
          return text;
        }
        return '';
      }).join('');
      
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
  } catch {
    // Parsing failed, treat as HTML
  }
  
  // Fallback: render as HTML
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

const ContentItem: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type') as keyof typeof CONTENT_TYPES;
  
  const [item, setItem] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !type) return;
    
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/content?contentType=publications&type=${type}&id=${id}`);
        const data = await response.json();
        if (data.success && data.publications && data.publications.length > 0) {
          setItem(data.publications[0]);
        } else {
          setError('Contenu non trouvé');
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        setError('Erreur lors du chargement du contenu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItem();
  }, [id, type]);

  if (!id || !type) {
    return <Navigate to="/publications" />;
  }

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

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Contenu non trouvé'}</p>
          <a 
            href={`/publications?type=${type}`}
            className="text-srh-blue hover:text-srh-blue-dark underline"
          >
            Retour à la liste
          </a>
        </div>
      </div>
    );
  }

  const config = CONTENT_TYPES[type];

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white`}>
              {config.title}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{item.title}</h1>
          <div className="flex items-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(item.pubdate).toLocaleDateString('fr-FR')}
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {item.tags.slice(0, 3).join(', ')}
                {item.tags.length > 3 && '...'}
              </div>
            )}
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back link */}
          <div className="mb-6">
            <a 
              href={`/publications?type=${type}`}
              className="text-srh-blue hover:text-srh-blue-dark underline flex items-center gap-2"
            >
              ← Retour à la liste
            </a>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {item.picture && (
              <div className="mb-6">
                <img 
                  src={item.picture} 
                  alt={item.title}
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              {renderContent(item.content)}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  Publié le {new Date(item.pubdate).toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center gap-4">
                  {item.subscribersonly && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Abonnés seulement
                    </span>
                  )}
                  {item.homepage && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Page d'accueil
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentItem;