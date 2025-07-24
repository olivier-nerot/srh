import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Edit, FileText, Download, Calendar } from 'lucide-react';

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

interface Document {
  id: number;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

interface ArticleData {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  type: string;
  tags: string[];
  picture?: string;
  documents: Document[];
}

// Helper function to convert Delta JSON to HTML for display
const deltaToHtml = (content: string): string => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Convert Delta ops to HTML
      const html = delta.ops.map((op: any) => {
        if (typeof op.insert === 'string') {
          let text = op.insert;
          
          // Apply basic formatting
          if (op.attributes) {
            if (op.attributes.bold) text = `<strong>${text}</strong>`;
            if (op.attributes.italic) text = `<em>${text}</em>`;
            if (op.attributes.underline) text = `<u>${text}</u>`;
            if (op.attributes.link) text = `<a href="${op.attributes.link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
            if (op.attributes.header) text = `<h${op.attributes.header} class="text-xl font-semibold mt-4 mb-2">${text}</h${op.attributes.header}>`;
          }
          
          // Convert newlines to paragraphs
          text = text.replace(/\n\n/g, '</p><p class="mb-4">').replace(/\n/g, '<br>');
          
          return text;
        }
        return '';
      }).join('');
      
      return `<p class="mb-4">${html}</p>`;
    }
  } catch {
    // Parsing failed, treat as HTML or plain text
    return content.replace(/\n/g, '<br>');
  }
  
  // Fallback: render as HTML
  return content.replace(/\n/g, '<br>');
};

// Helper component to display tag chips
const TagChips: React.FC<{ tags: string[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

const Article: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = searchParams.get('id');
  const isAdmin = user?.isadmin === true;

  const fetchPublication = async (id: string): Promise<Publication | null> => {
    try {
      const response = await fetch('/api/publications');
      const data = await response.json();
      if (data.success) {
        return data.publications.find((pub: Publication) => pub.id.toString() === id) || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching publication:', error);
      return null;
    }
  };

  const fetchDocuments = async (attachmentIds: number[]): Promise<Document[]> => {
    if (!attachmentIds || attachmentIds.length === 0) return [];
    
    try {
      const response = await fetch(`/api/documents-by-ids?ids=${attachmentIds.join(',')}`);
      const data = await response.json();
      return data.success ? data.documents : [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };

  const getEditUrl = (type: string): string => {
    return type === 'communique' ? '/admin/communiques' : '/admin/publications';
  };

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) {
        setError('Article ID not provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch publication from database
        const publication = await fetchPublication(articleId);
        if (!publication) {
          setError('Article not found');
          setLoading(false);
          return;
        }

        // Fetch associated documents
        const documents = await fetchDocuments(publication.attachmentIds || []);
        
        setArticleData({
          id: publication.id.toString(),
          title: publication.title,
          content: publication.content,
          publishDate: publication.pubdate,
          type: publication.type,
          tags: publication.tags || [],
          picture: publication.picture,
          documents
        });
      } catch (error) {
        console.error('Error loading article:', error);
        setError('Failed to load article content');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error || !articleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-lg p-10 mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6 flex-1">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  {articleData.title}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      Publié le {new Date(articleData.publishDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span className="capitalize">{articleData.type}</span>
                  </div>
                </div>
                {articleData.tags.length > 0 && (
                  <div className="mb-4">
                    <TagChips tags={articleData.tags} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Admin Edit Button */}
            {isAdmin && (
              <div className="ml-4">
                <Link
                  to={getEditUrl(articleData.type)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Image Section */}
        {articleData.picture && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10">
            <img 
              src={articleData.picture} 
              alt={articleData.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10">
          <div className="p-10">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: deltaToHtml(articleData.content) }}
              />
            </div>
          </div>
        </article>

        {/* Documents Section */}
        {articleData.documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-blue-600" />
              Documents joints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articleData.documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{document.title || document.fileName}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Fichier: {document.fileName}</p>
                        <p>Taille: {(document.fileSize / 1024).toFixed(1)} KB</p>
                        <p>Type: {document.mimeType}</p>
                      </div>
                    </div>
                    <a
                      href={document.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ml-4"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Article original</p>
              <p className="text-xs text-gray-600">Publié le {new Date(articleData.publishDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
            
            <Link
              to="/"
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Back to top button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Retour en haut
          </button>
        </div>
      </div>
    </div>
  );
};

export default Article;