import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';
import { Edit, Plus, Trash2, Save, X } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

interface EditingFAQ {
  id?: number;
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const { user } = useAuthStore();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingFAQ | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quillRef, setQuillRef] = useState<any>(null);

  const isAdmin = user?.isadmin === true;

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faq');
      const data = await response.json();
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing || !isAdmin) return;

    try {
      const url = '/api/faq';
      const method = editing.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editing,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFAQs(); // Refresh the list
        setEditing(null);
        setShowAddForm(false);
      } else {
        alert('Erreur lors de la sauvegarde: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin || !confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) return;

    try {
      const response = await fetch('/api/faq', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFAQs(); // Refresh the list
      } else {
        alert('Erreur lors de la suppression: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const startEdit = (faq: FAQItem) => {
    setQuillRef(null);
    setEditing({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setQuillRef(null);
    setEditing({
      question: '',
      answer: '',
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowAddForm(false);
  };

  const quillConfig = {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link'],
        ['clean']
      ],
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Foire Aux Questions
              </h1>
              <p className="text-gray-600">
                Trouvez rapidement des réponses aux questions les plus fréquemment posées
              </p>
            </div>
            {isAdmin && !editing && (
              <button
                onClick={startAdd}
                className="bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter une FAQ
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {editing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {showAddForm ? 'Ajouter une nouvelle FAQ' : 'Modifier la FAQ'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  placeholder="Entrez votre question..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Réponse
                </label>
                <QuillEditor
                  key={`quill-${editing.id || 'new'}-${showAddForm}`}
                  defaultValue={{ ops: [{ insert: '' }] }}
                  onTextChange={(delta, oldDelta, source) => {
                    if (source === 'user' && quillRef) {
                      const html = quillRef.getSemanticHTML();
                      setEditing(prev => prev ? { ...prev, answer: html } : null);
                    }
                  }}
                  onReady={(quill) => {
                    setQuillRef(quill);
                    // Set initial content if editing
                    if (editing.answer) {
                      quill.root.innerHTML = editing.answer;
                    }
                  }}
                  config={quillConfig}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!editing.question.trim() || !editing.answer.replace(/<[^>]*>/g, '').trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">Aucune FAQ disponible pour le moment.</p>
              {isAdmin && (
                <button
                  onClick={startAdd}
                  className="mt-4 bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter la première FAQ
                </button>
              )}
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {faq.question}
                    </h3>
                    {isAdmin && !editing && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEdit(faq)}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="Éditer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQ;