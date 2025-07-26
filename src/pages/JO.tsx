import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, ExternalLink, Search } from 'lucide-react';

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
  const navigate = useNavigate();
  const [journalOfficielTexts, setJournalOfficielTexts] = useState<JOText[]>([]);
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJOTexts();
  }, []);


  const fetchJOTexts = async () => {
    try {
      const response = await fetch('/api/content?contentType=jotextes');
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

  const handleTextClick = (text: JOText) => {
    navigate(`/jo/text?id=${text.id}`);
  };

  const handleDownloadDocument = async (text: JOText) => {
    if (text.document && documents[text.document]) {
      const pdfDocument = documents[text.document];
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

  const filteredTexts = journalOfficielTexts.filter(text =>
    text.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    text.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les textes par nom ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
        ) : filteredTexts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 
                `Aucun texte trouvé pour "${searchTerm}"` : 
                'Aucun texte disponible pour le moment.'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTexts.map((text) => (
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
      </div>
    </>
  );
};

export default JO;