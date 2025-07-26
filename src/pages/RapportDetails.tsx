import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, ArrowLeft } from 'lucide-react';

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

const RapportDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rapportId = searchParams.get('id');
  
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rapportId) {
      fetchRapport(rapportId);
    } else {
      setError('ID du rapport manquant');
      setLoading(false);
    }
  }, [rapportId]);

  const fetchRapport = async (id: string) => {
    try {
      // Fetch the specific rapport
      const response = await fetch('/api/content?contentType=rapports');
      const result = await response.json();
      
      if (result.success) {
        const foundRapport = result.rapports.find((rapport: Rapport) => rapport.id.toString() === id);
        if (foundRapport) {
          setRapport(foundRapport);
          
          // Fetch document if available
          if (foundRapport.document) {
            await fetchDocument(foundRapport.document);
          }
        } else {
          setError('Rapport introuvable');
        }
      } else {
        setError('Erreur lors du chargement du rapport');
      }
    } catch (err) {
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents?ids=${documentId}`);
      const result = await response.json();
      if (result.success && result.documents.length > 0) {
        setDocument(result.documents[0]);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  };

  const handleDownloadDocument = async () => {
    if (!document) return;
    
    try {
      // Fetch the file and create a download link
      const response = await fetch(document.file_path);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name || document.title + '.pdf';
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
      window.open(document.file_path, '_blank');
    }
  };

  const handleBackToList = () => {
    navigate('/rapports');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
          <p className="text-gray-600">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error || !rapport) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Rapport non trouvé'}</p>
          <button 
            onClick={handleBackToList}
            className="mt-4 text-green-600 hover:text-green-700 font-medium flex items-center space-x-2"
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
      {/* Green curved header section */}
      <section className="bg-green-600 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackToList}
              className="text-white hover:bg-green-700 p-2 rounded-md transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Rapport Institutionnel</h1>
              <p className="text-xl opacity-90">Étude et analyse d'organisme officiel</p>
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
            className="hover:text-green-600 transition-colors"
          >
            Rapports institutionnels
          </button>
          <span>/</span>
          <span className="text-gray-900">{rapport.name}</span>
        </nav>

        {/* Rapport Info Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
              Rapport Institutionnel
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Publié le {new Date(rapport.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {rapport.name}
          </h1>

          {/* Document Download Section */}
          {document && (
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
                      {document.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadDocument}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à la liste</span>
            </button>
            {document && (
              <button
                onClick={handleDownloadDocument}
                className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Rapport Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-green-600" />
            Contenu du rapport
          </h2>
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {rapport.content}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <button 
            onClick={handleBackToList}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la liste</span>
          </button>
          {document && (
            <button
              onClick={handleDownloadDocument}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
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

export default RapportDetails;