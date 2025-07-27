import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, ExternalLink, Search } from 'lucide-react';

interface Rapport {
  id: number;
  name: string;
  content: string;
  year: string;
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
  const navigate = useNavigate();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRapports();
  }, []);


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
    navigate(`/rapports/details?id=${rapport.id}`);
  };

  const handleDownloadDocument = async (rapport: Rapport) => {
    if (rapport.document && documents[rapport.document]) {
      const pdfDocument = documents[rapport.document];
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
    }
  };

  const filteredRapports = rapports.filter(rapport =>
    rapport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapport.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered rapports by year
  const groupedRapportsByYear = filteredRapports.reduce((groups: { [year: string]: Rapport[] }, rapport) => {
    const year = rapport.year || 'Sans année';
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(rapport);
    return groups;
  }, {});

  // Sort years in descending order (most recent first)
  const sortedYears = Object.keys(groupedRapportsByYear).sort((a, b) => {
    if (a === 'Sans année') return 1;
    if (b === 'Sans année') return -1;
    return parseInt(b) - parseInt(a);
  });

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
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Rapports institutionnels</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">À propos des rapports</h3>
          <p className="text-blue-800">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
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
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <div key={year} className="space-y-6">
                {/* Year Header */}
                <div className="flex items-center space-x-4">
                  <div className="bg-srh-blue text-white px-4 py-2 rounded-lg font-bold text-lg">
                    {year}
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {groupedRapportsByYear[year].length} document{groupedRapportsByYear[year].length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Year Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {groupedRapportsByYear[year].map((rapport) => (
                    <article 
                      key={rapport.id} 
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleRapportClick(rapport)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
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
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Rapports;