import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Calendar, Save, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import DocumentUpload from '../../components/ui/DocumentUpload';

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

const AdminRapports: React.FC = () => {
  const { user } = useAuthStore();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRapport, setEditingRapport] = useState<Rapport | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    document: null as number | null
  });
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});

  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    setLoading(true);
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
        setError(result.error || 'Erreur lors du chargement des rapports');
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

  const handleCreate = () => {
    setIsCreating(true);
    setEditingRapport(null);
    setFormData({ name: '', content: '', document: null });
    setIsEditModalOpen(true);
  };

  const handleEdit = (rapport: Rapport) => {
    setIsCreating(false);
    setEditingRapport(rapport);
    setFormData({
      name: rapport.name,
      content: rapport.content,
      document: rapport.document
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError('Le nom et le contenu sont requis');
      return;
    }

    try {
      const url = '/api/content?contentType=rapports';
      const method = isCreating ? 'POST' : 'PUT';
      const body = {
        ...formData,
        isAdmin: user?.isadmin,
        ...(editingRapport && { id: editingRapport.id })
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        setIsEditModalOpen(false);
        setError('');
        await fetchRapports();
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    try {
      const response = await fetch('/api/content?contentType=rapports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAdmin: user?.isadmin })
      });

      const result = await response.json();
      if (result.success) {
        await fetchRapports();
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDocumentUpload = (documentIds: number[]) => {
    setFormData(prev => ({ ...prev, document: documentIds[0] || null }));
  };

  const filteredRapports = rapports;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <FileText className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rapports institutionnels</h1>
                <p className="text-gray-600 mt-1">{rapports.length} rapports</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau rapport</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Rapports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRapports.map((rapport) => (
            <div key={rapport.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{rapport.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(rapport)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rapport.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {rapport.content.substring(0, 150)}...
                  </p>
                </div>

                {rapport.document && documents[rapport.document] && (
                  <div className="flex items-center mb-3 text-sm text-green-600">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{documents[rapport.document].title}</span>
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  Créé le {formatDate(rapport.createdAt.toString())}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRapports.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun rapport trouvé.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Nouveau rapport' : 'Modifier le rapport'}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du rapport *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Rapport de la Cour des comptes sur..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Description du rapport et de ses conclusions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document PDF (optionnel)
                  </label>
                  <DocumentUpload
                    onDocumentsChange={handleDocumentUpload}
                    currentDocumentIds={formData.document ? [formData.document] : []}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRapports;