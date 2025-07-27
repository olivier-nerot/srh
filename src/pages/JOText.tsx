import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';

interface JOText {
  id: number;
  name: string;
  content: string;
  document: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
}

const JOText: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const textId = searchParams.get('id');
  
  const [joText, setJoText] = useState<JOText | null>(null);
  const [pdfDocument, setPdfDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (textId) {
      fetchJOText(textId);
    } else {
      setError('ID du texte manquant');
      setLoading(false);
    }
  }, [textId]);

  const fetchJOText = async (id: string) => {
    try {
      // Fetch the specific JO text
      const response = await fetch('/api/content?contentType=jotextes');
      const result = await response.json();
      
      if (result.success) {
        const foundText = result.jotextes.find((text: JOText) => text.id.toString() === id);
        if (foundText) {
          setJoText(foundText);
          
          // Fetch document if available
          if (foundText.document) {
            await fetchDocument(foundText.document);
          }
        } else {
          setError('Texte introuvable');
        }
      } else {
        setError('Erreur lors du chargement du texte');
      }
    } catch (err) {
      setError('Erreur lors du chargement du texte');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents?ids=${documentId}`);
      const result = await response.json();
      if (result.success && result.documents.length > 0) {
        setPdfDocument(result.documents[0]);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  };

  const handleDownloadDocument = async () => {
    if (!pdfDocument) return;
    
    try {
      // Fetch the file and create a download link
      const response = await fetch(pdfDocument.file_path);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfDocument.file_name || pdfDocument.title + '.pdf';
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback to window.open if fetch fails
      window.open(pdfDocument.file_path, '_blank');
    }
  };

  const handleBackToList = () => {
    navigate('/jo');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-gray-600">Chargement du texte...</p>
        </div>
      </div>
    );
  }

  if (error || !joText) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Texte non trouvé'}</p>
          <button 
            onClick={handleBackToList}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la liste</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackToList}
              className="text-white hover:bg-srh-blue-dark p-2 rounded-md transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Texte du Journal Officiel</h1>
              <p className="text-xl opacity-90">Décret, arrêté ou instruction officielle</p>
            </div>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <button 
            onClick={handleBackToList}
            className="hover:text-blue-600 transition-colors"
          >
            Textes du Journal Officiel
          </button>
          <span>/</span>
          <span className="text-gray-900">{joText.name}</span>
        </nav>

        {/* Text Info Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full">
              Texte Officiel
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Publié le {new Date(joText.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {joText.name}
          </h1>

          {/* Document Download Section */}
          {pdfDocument && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Document PDF disponible
                    </h3>
                    <p className="text-sm text-blue-700">
                      {pdfDocument.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadDocument}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Text Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Contenu du texte
          </h2>
          <div className="prose prose-lg max-w-none">
            {joText.content && joText.content.includes('<div class="pdf-content">') ? (
              // Display formatted HTML content
              <div 
                className="html-content"
                dangerouslySetInnerHTML={{ __html: joText.content }}
              />
            ) : (
              // Fallback for plain text content
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {joText.content || 'Aucun contenu disponible.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-center bg-gray-50 rounded-lg p-4">
          {pdfDocument && (
            <button
              onClick={handleDownloadDocument}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger PDF</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default JOText;