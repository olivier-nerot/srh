import React, { useState, useEffect } from 'react';
import { Scale, Plus, Edit, Trash2, Search, Calendar, FileText, Save, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import DocumentUpload from '../../components/ui/DocumentUpload';

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

const AdminJO: React.FC = () => {
  const { user } = useAuthStore();
  const [jotextes, setJOTextes] = useState<JOText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingText, setEditingText] = useState<JOText | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    document: null as number | null
  });
  const [documents, setDocuments] = useState<{ [key: number]: Document }>({});

  useEffect(() => {
    fetchJOTextes();
  }, []);

  const fetchJOTextes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jotextes');
      const result = await response.json();
      if (result.success) {
        setJOTextes(result.jotextes);
        // Fetch document details for texts that have documents
        const documentIds = result.jotextes
          .filter((text: JOText) => text.document)
          .map((text: JOText) => text.document);
        if (documentIds.length > 0) {
          await fetchDocuments(documentIds);
        }
      } else {
        setError(result.error || 'Erreur lors du chargement des textes JO');
      }
    } catch (err) {
      setError('Erreur lors du chargement des textes JO');
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

  const handleCreate = () => {
    setIsCreating(true);
    setEditingText(null);
    setFormData({ name: '', content: '', document: null });
    setIsEditModalOpen(true);
  };

  const handleEdit = (text: JOText) => {
    setIsCreating(false);
    setEditingText(text);
    setFormData({
      name: text.name,
      content: text.content,
      document: text.document
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError('Le nom et le contenu sont requis');
      return;
    }

    try {
      const url = '/api/jotextes';
      const method = isCreating ? 'POST' : 'PUT';
      const body = {
        ...formData,
        isAdmin: user?.isadmin,
        ...(editingText && { id: editingText.id })
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
        await fetchJOTextes();
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce texte ?')) return;

    try {
      const response = await fetch('/api/jotextes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAdmin: user?.isadmin })
      });

      const result = await response.json();
      if (result.success) {
        await fetchJOTextes();
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDocumentUpload = (documentIds: number[]) => {
    setFormData(prev => ({ ...prev, document: documentIds[0] || null }));
  };

  const filteredTextes = jotextes.filter(text =>
    text.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    text.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="text-gray-600">Chargement des textes JO...</p>
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
                <Scale className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Textes du Journal Officiel</h1>
                <p className="text-gray-600 mt-1">{jotextes.length} textes</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau texte</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Texts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTextes.map((text) => (
            <div key={text.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{text.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(text)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(text.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {text.content.substring(0, 150)}...
                  </p>
                </div>

                {text.document && documents[text.document] && (
                  <div className="flex items-center mb-3 text-sm text-blue-600">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{documents[text.document].title}</span>
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  Créé le {formatDate(text.createdAt.toString())}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTextes.length === 0 && !loading && (
          <div className="text-center py-12">
            <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun texte trouvé.</p>
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
                  {isCreating ? 'Nouveau texte JO' : 'Modifier le texte JO'}
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
                    Nom du texte *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Décret n° 2024-940..."
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
                    placeholder="Contenu du texte officiel..."
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

export default AdminJO;