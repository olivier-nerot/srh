import React, { useState, useEffect } from 'react';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';
import { Edit, Plus, Trash2, Save, X, Megaphone, Calendar } from 'lucide-react';
import ImageUpload from '../../components/ui/ImageUpload';
import DocumentUpload from '../../components/ui/DocumentUpload';

interface Publication {
  id: number;
  title: string;
  content: string;
  tags: string[];
  pubdate: string;
  subscribersonly: boolean;
  homepage: boolean;
  picture?: string;
  attachmentIds: number[];
  createdAt: string;
  updatedAt: string;
}

interface EditingPublication {
  id?: number;
  title: string;
  content: string;
  tags: string[];
  pubdate: string;
  subscribersonly: boolean;
  homepage: boolean;
  picture?: string;
  attachmentIds: number[];
}

// Helper component to display tag chips
const TagChips: React.FC<{ tags: string[] }> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

// Helper component to display publication content
const PublicationContentDisplay: React.FC<{ content: string }> = ({ content }) => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Convert Delta ops to simple HTML
      const html = delta.ops.map((op: { insert?: string; attributes?: Record<string, any> }) => {
        if (typeof op.insert === 'string') {
          let text = op.insert;
          
          // Apply basic formatting
          if (op.attributes) {
            if (op.attributes.bold) text = `<strong>${text}</strong>`;
            if (op.attributes.italic) text = `<em>${text}</em>`;
            if (op.attributes.underline) text = `<u>${text}</u>`;
            if (op.attributes.link) text = `<a href="${op.attributes.link}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            if (op.attributes.header) text = `<h${op.attributes.header}>${text}</h${op.attributes.header}>`;
          }
          
          // Convert newlines to br tags
          text = text.replace(/\n/g, '<br>');
          
          return text;
        }
        return '';
      }).join('');
      
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
  } catch {
    // Parsing failed, treat as HTML or plain text
  }
  
  // Fallback: render as HTML
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

const AdminCommuniques: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingPublication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quillRef, setQuillRef] = useState<any>(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingTagsInput, setEditingTagsInput] = useState('');
  const [editingPubDate, setEditingPubDate] = useState('');
  const [editingSubscribersOnly, setEditingSubscribersOnly] = useState(false);
  const [editingHomepage, setEditingHomepage] = useState(true);
  const [editingPicture, setEditingPicture] = useState<string | undefined>(undefined);
  const [editingAttachmentIds, setEditingAttachmentIds] = useState<number[]>([]);

  useEffect(() => {
    fetchCommuniques();
  }, []);

  const fetchCommuniques = async () => {
    try {
      const response = await fetch('/api/content?contentType=publications&type=communique');
      const data = await response.json();
      if (data.success) {
        setPublications(data.publications);
      }
    } catch (error) {
      console.error('Error fetching communiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;

    // Get the current content from the Quill editor as Delta JSON
    let contentValue = editing.content;
    if (quillRef) {
      const delta = quillRef.getContents();
      contentValue = JSON.stringify(delta);
    }

    try {
      const url = '/api/content?contentType=publications';
      const method = editing.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editing,
          title: editingTitle,
          content: contentValue,
          tags: editingTags,
          pubdate: editingPubDate,
          subscribersonly: editingSubscribersOnly,
          homepage: editingHomepage,
          picture: editingPicture,
          attachmentIds: editingAttachmentIds,
          type: 'communique',
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCommuniques(); // Refresh the list
        setEditing(null);
        setShowAddForm(false);
        setQuillRef(null);
      } else {
        alert('Erreur lors de la sauvegarde: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving communique:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce communiqué ?')) return;

    try {
      const response = await fetch('/api/content?contentType=publications', {
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
        await fetchCommuniques(); // Refresh the list
      } else {
        alert('Erreur lors de la suppression: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting communique:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const startEdit = (publication: Publication) => {
    setQuillRef(null);
    setHasEditorContent(false);
    setEditingTitle(publication.title);
    setEditingTags(publication.tags || []);
    setEditingTagsInput((publication.tags || []).join(', '));
    setEditingPubDate(new Date(publication.pubdate).toISOString().slice(0, 10));
    setEditingSubscribersOnly(publication.subscribersonly);
    setEditingHomepage(publication.homepage);
    setEditingPicture(publication.picture);
    setEditingAttachmentIds(publication.attachmentIds || []);
    setEditing({
      id: publication.id,
      title: publication.title,
      content: publication.content,
      tags: publication.tags || [],
      pubdate: publication.pubdate,
      subscribersonly: publication.subscribersonly,
      homepage: publication.homepage,
      picture: publication.picture,
      attachmentIds: publication.attachmentIds || [],
    });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setQuillRef(null);
    setHasEditorContent(false);
    setEditingTitle('');
    setEditingTags([]);
    setEditingTagsInput('');
    setEditingPubDate(new Date().toISOString().slice(0, 10));
    setEditingSubscribersOnly(false);
    setEditingHomepage(true);
    setEditingPicture(undefined);
    setEditingAttachmentIds([]);
    setEditing({
      title: '',
      content: '',
      tags: [],
      pubdate: new Date().toISOString(),
      subscribersonly: false,
      homepage: true,
      picture: undefined,
      attachmentIds: [],
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowAddForm(false);
    setEditingTitle('');
    setEditingTags([]);
    setEditingTagsInput('');
    setEditingPubDate('');
    setEditingSubscribersOnly(false);
    setEditingHomepage(true);
    setEditingPicture(undefined);
    setEditingAttachmentIds([]);
    setQuillRef(null);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des communiqués...</p>
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
                <Megaphone className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Communiqués</h1>
                <p className="text-gray-600 mt-1">{publications.length} communiqués</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={startAdd}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau communiqué</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Add/Edit Form */}
        {editing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {showAddForm ? 'Ajouter un nouveau communiqué' : 'Modifier le communiqué'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Entrez le titre du communiqué..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de publication
                  </label>
                  <input
                    type="date"
                    value={editingPubDate}
                    onChange={(e) => setEditingPubDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                
                <div className="flex items-center space-x-6 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSubscribersOnly}
                      onChange={(e) => setEditingSubscribersOnly(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Abonnés seulement</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingHomepage}
                      onChange={(e) => setEditingHomepage(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Afficher sur l'accueil</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={editingTagsInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setEditingTagsInput(inputValue);
                    
                    // Update the tags array for display and saving
                    const newTags = inputValue
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    setEditingTags(newTags);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Entrez les tags séparés par des virgules..."
                />
                {editingTags.length > 0 && (
                  <div className="mt-2">
                    <TagChips tags={editingTags} />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu
                </label>
                <QuillEditor
                  onReady={(quill) => {
                    setQuillRef(quill);
                    
                    // Set up text-change event listener
                    quill.on('text-change', (_delta, _oldDelta, source) => {
                      if (source === 'user') {
                        const text = quill.getText().trim();
                        setHasEditorContent(text.length > 0);
                      }
                    });
                    
                    // Set initial content if editing existing publication
                    if (editing?.content && editing.id) {
                      setTimeout(() => {
                        try {
                          const savedDelta = JSON.parse(editing.content);
                          let ops = savedDelta.ops || [];
                          
                          if (ops.length > 0) {
                            const lastOp = ops[ops.length - 1];
                            if (!lastOp.insert || !lastOp.insert.endsWith('\n')) {
                              if (lastOp.insert) {
                                lastOp.insert += '\n';
                              } else {
                                ops.push({ insert: '\n' });
                              }
                            }
                          } else {
                            ops = [{ insert: '\n' }];
                          }
                          
                          quill.setContents(ops, 'api');
                          quill.update();
                          
                          setTimeout(() => {
                            quill.focus();
                          }, 50);
                          
                          const text = quill.getText().trim();
                          setHasEditorContent(text.length > 0);
                        } catch {
                          quill.root.innerHTML = editing.content;
                          quill.update();
                          
                          setTimeout(() => {
                            quill.focus();
                          }, 50);
                          
                          const text = quill.getText().trim();
                          setHasEditorContent(text.length > 0);
                        }
                      }, 100);
                    } else {
                      setHasEditorContent(false);
                    }
                  }}
                  config={quillConfig}
                />
              </div>
              
              {/* Image Upload */}
              <ImageUpload
                onImageSelect={setEditingPicture}
                currentImage={editingPicture}
                onImageRemove={() => setEditingPicture(undefined)}
              />
              
              {/* Document Upload */}
              <DocumentUpload
                onDocumentsChange={setEditingAttachmentIds}
                currentDocumentIds={editingAttachmentIds}
              />
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!editingTitle.trim() || !hasEditorContent || !editingPubDate}
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

        {/* Communiques Management List */}
        {!editing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <Megaphone className="h-8 w-8 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Gestion des communiqués</h2>
            </div>
            
            {publications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Aucun communiqué disponible pour le moment.</p>
                <button
                  onClick={startAdd}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter le premier communiqué
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {publications.map((publication) => (
                  <div key={publication.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {publication.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {new Date(publication.pubdate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <TagChips tags={publication.tags || []} />
                          <div className="flex gap-2">
                            {publication.subscribersonly && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Abonnés seulement
                              </span>
                            )}
                            {publication.homepage && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Page d'accueil
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="prose prose-sm max-w-none text-gray-700 line-clamp-3">
                          <PublicationContentDisplay content={publication.content} />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEdit(publication)}
                          className="text-gray-600 hover:text-gray-800 p-2 transition-colors"
                          title="Éditer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(publication.id)}
                          className="text-gray-600 hover:text-red-600 p-2 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommuniques;