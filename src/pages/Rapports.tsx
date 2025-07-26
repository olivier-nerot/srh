import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, X, ExternalLink, Search } from 'lucide-react';

interface Rapport {
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

const Rapports: React.FC = () => {
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRapports();
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

  const fetchRapports = async () => {
    try {
      const response = await fetch('/api/content?contentType=rapports');
      const result = await response.json();
      if (result.success) {
        setRapports(result.rapports);
        // Fetch document details for rapports that have documents
        const documentIds = result.rapports
          .filter((rapport: Rapport) => rapport.document)
          .map((rapport: Rapport) => rapport.document);
        if (documentIds.length > 0) {
          await fetchDocuments(documentIds);
        }
      } else {
        setError('Erreur lors du chargement des rapports');
      }
    } catch {
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (documentIds: number[]) => {
    try {
      const response = await fetch(`/api/documents?ids=${documentIds.join(',')}`);
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

  const handleRapportClick = (rapport: Rapport) => {
    setSelectedRapport(rapport);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRapport(null);
  };

  const handleDownloadDocument = (rapport: Rapport) => {
    if (rapport.document && documents[rapport.document]) {
      window.open(documents[rapport.document].file_path, '_blank');
    }
  };

  const filteredRapports = rapports.filter(rapport =>
    rapport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapport.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rapports institutionnels</h1>
          <p className="text-xl opacity-90">Études et analyses des organismes officiels</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <FileText className="h-8 w-8 text-green-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Rapports institutionnels</h2>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-2">À propos des rapports</h3>
          <p className="text-green-800">
            Les rapports institutionnels présentés ici émanent d'organismes officiels (Cour des comptes, IGAS, etc.) 
            et traitent de sujets importants pour l'exercice de la radiologie hospitalière.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les rapports par nom ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
            <p className="text-gray-600">Chargement des rapports...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredRapports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 
                `Aucun rapport trouvé pour "${searchTerm}"` : 
                'Aucun rapport disponible pour le moment.'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-green-600 hover:text-green-700 text-sm"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRapports.map((rapport) => (
              <article 
                key={rapport.id} 
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleRapportClick(rapport)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Rapport Institutionnel
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(rapport.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-tight">
                  {rapport.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {rapport.content.substring(0, 150)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRapportClick(rapport);
                    }}
                    className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>Consulter le rapport</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  {rapport.document && documents[rapport.document] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(rapport);
                      }}
                      className="text-gray-400 hover:text-gray-600 flex items-center space-x-1"
                      title={`Télécharger ${documents[rapport.document].title}`}
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
      </div>

      {/* Modal for displaying full rapport content */}
      {isModalOpen && selectedRapport && (
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
                  <h2 className="text-xl font-bold">Rapport Institutionnel</h2>
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
              {/* Rapport Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
                    Rapport Institutionnel
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Publié le {new Date(selectedRapport.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedRapport.name}
                </h1>
              </div>

              {/* Document Download Section */}
              {selectedRapport.document && documents[selectedRapport.document] && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-600 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-900">
                          Document PDF disponible
                        </h3>
                        <p className="text-sm text-green-700">
                          {documents[selectedRapport.document].title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(selectedRapport)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Télécharger PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Rapport Content */}
              <div className="prose prose-lg max-w-none">
                <div className="bg-gray-50 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contenu du rapport</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRapport.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3">
              {selectedRapport.document && documents[selectedRapport.document] && (
                <button
                  onClick={() => handleDownloadDocument(selectedRapport)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
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

export default Rapports;