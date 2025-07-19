import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { siteContent } from '../data/content';

interface ArticleData {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  pdfFile: string;
}

const Article: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = searchParams.get('id');

  const loadHtmlContent = async (pdfFileName: string): Promise<string> => {
    try {
      const htmlFileName = pdfFileName.replace('.pdf', '.html');
      const response = await fetch(`/converted-html/${htmlFileName}`);
      if (!response.ok) {
        throw new Error('Failed to load HTML content');
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading HTML content:', error);
      // Fallback: return a message that HTML content failed to load
      return '<p class="text-red-600">Unable to load content. Please download the original PDF file.</p>';
    }
  };

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) {
        setError('Article ID not provided');
        setLoading(false);
        return;
      }

      // Find article in siteContent.news
      const newsArticle = siteContent.news.find(item => item.id === articleId);
      if (!newsArticle || !newsArticle.pdf) {
        setError('Article not found');
        setLoading(false);
        return;
      }

      try {
        // Load pre-converted HTML content
        const htmlContent = await loadHtmlContent(newsArticle.pdf);
        
        setArticleData({
          id: newsArticle.id,
          title: newsArticle.title,
          content: htmlContent,
          publishDate: newsArticle.publishedAt,
          pdfFile: newsArticle.pdf
        });
      } catch {
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
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {articleData.title}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Publié le {articleData.publishDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Document officiel</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-10">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-800 leading-relaxed pdf-content"
                dangerouslySetInnerHTML={{ __html: articleData.content }}
              />
            </div>
          </div>
        </article>

        {/* Footer Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Document source</p>
              <p className="text-xs text-gray-600">Format PDF original disponible</p>
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
            
            <a 
              href={`/assets/pdf/${articleData.pdfFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Télécharger PDF
            </a>
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