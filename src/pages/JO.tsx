import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, X, ExternalLink } from 'lucide-react';

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

const JO: React.FC = () => {
  const [journalOfficielTexts, setJournalOfficielTexts] = useState<JOText[]>([]);
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedText, setSelectedText] = useState<JOText | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchJOTexts();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchJOTexts = async () => {
    try {
      const response = await fetch('/api/jotextes');
      const result = await response.json();
      if (result.success) {
        setJournalOfficielTexts(result.jotextes);
        // Fetch document details for texts that have documents
        const documentIds = result.jotextes
          .filter((text: JOText) => text.document)
          .map((text: JOText) => text.document);
        if (documentIds.length > 0) {
          await fetchDocuments(documentIds);
        }
      } else {
        setError('Erreur lors du chargement des textes');
      }
    } catch (err) {
      setError('Erreur lors du chargement des textes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (documentIds: number[]) => {
    try {
      const response = await fetch(`/api/documents-by-ids?ids=${documentIds.join(',')}`);
      const result = await response.json();
      if (result.success) {
        const docMap: { [key: number]: Document } = {};
        result.documents.forEach((doc: Document) => {
          docMap[doc.id] = doc;
        });
        setDocuments(docMap);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleTextClick = (text: JOText) => {
    setSelectedText(text);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedText(null);
  };

  const handleDownloadDocument = (text: JOText) => {
    if (text.document && documents[text.document]) {
      window.open(documents[text.document].file_path, '_blank');
    }
  };

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Textes du Journal Officiel</h1>
          <p className="text-xl opacity-90">Décrets, arrêtés et instructions officielles</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Textes du Journal Officiel</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Information importante</h3>
          <p className="text-blue-800">
            Cette section regroupe les textes officiels publiés au Journal Officiel qui concernent directement 
            l'exercice de la radiologie hospitalière, les statuts des praticiens et l'organisation des services.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-gray-600">Chargement des textes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {journalOfficielTexts.map((text) => (
              <article 
                key={text.id} 
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTextClick(text)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Texte Officiel
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(text.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-tight">
                  {text.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {text.content.substring(0, 150)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextClick(text);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>Consulter le texte</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  {text.document && documents[text.document] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(text);
                      }}
                      className="text-gray-400 hover:text-gray-600 flex items-center space-x-1"
                      title={`Télécharger ${documents[text.document].title}`}
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-xs">PDF</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Search and Filter */}
        <section className="bg-gray-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rechercher dans les textes</h2>
          <p className="text-gray-700 mb-6">
            Utilisez les filtres ci-dessous pour trouver rapidement les textes officiels qui vous intéressent.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Recherche par mots-clés
              </label>
              <input
                type="text"
                id="search"
                placeholder="Ex: radiologie, praticien, certification..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                <option value="decret">Décrets</option>
                <option value="instruction">Instructions</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                id="year"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les années</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Rechercher
            </button>
          </div>
        </section>
      </div>

      {/* Modal for displaying full text content */}
      {isModalOpen && selectedText && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-srh-blue text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Texte du Journal Officiel</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-srh-blue-dark p-2 rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Text Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full">
                    Texte Officiel
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Publié le {new Date(selectedText.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedText.name}
                </h1>
              </div>

              {/* Document Download Section */}
              {selectedText.document && documents[selectedText.document] && (
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
                          {documents[selectedText.document].title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(selectedText)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Télécharger PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="prose prose-lg max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contenu du texte</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedText.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              {selectedText.document && documents[selectedText.document] && (
                <button
                  onClick={() => handleDownloadDocument(selectedText)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger PDF</span>
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JO;