import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';
import { Edit, Plus, Trash2, Save, X, Megaphone, Calendar, Filter } from 'lucide-react';
import InfoCard from '../components/ui/InfoCard';
import ImageUpload from '../components/ui/ImageUpload';
import DocumentUpload from '../components/ui/DocumentUpload';


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
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-srh-blue text-white"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

// Helper function to convert Delta JSON to plain text for excerpts
const deltaToPlainText = (content: string): string => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Extract just the text content without formatting
      return delta.ops.map((op: any) => {
        if (typeof op.insert === 'string') {
          return op.insert.replace(/\n/g, ' ').trim();
        }
        return '';
      }).join('').trim();
    }
  } catch {
    // Parsing failed, treat as plain text and strip HTML tags
    return content.replace(/<[^>]*>/g, '').trim();
  }
  
  // Fallback: strip HTML tags and return plain text
  return content.replace(/<[^>]*>/g, '').trim();
};

// Helper component to display publication content
const PublicationContentDisplay: React.FC<{ content: string }> = ({ content }) => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Convert Delta ops to simple HTML
      const html = delta.ops.map((op: any) => {
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

const Communiques: React.FC = () => {
  const { user } = useAuthStore();
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdminView, setShowAdminView] = useState(false);

  const isAdmin = user?.isadmin === true;

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const response = await fetch('/api/publications?type=communique');
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
    if (!editing || !isAdmin) return;

    // Get the current content from the Quill editor as Delta JSON
    let contentValue = editing.content;
    if (quillRef) {
      const delta = quillRef.getContents();
      contentValue = JSON.stringify(delta);
    }

    try {
      const url = '/api/publications';
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
        await fetchPublications(); // Refresh the list
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
    if (!isAdmin || !confirm('Êtes-vous sûr de vouloir supprimer ce communiqué ?')) return;

    try {
      const response = await fetch('/api/publications', {
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
        await fetchPublications(); // Refresh the list
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
    setShowAdminView(true);
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
    setShowAdminView(true);
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
    setShowAdminView(false);
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Filter publications based on selected tags and current view mode
  const filteredPublications = selectedTags.length === 0 
    ? publications.filter(pub => showAdminView || pub.homepage)
    : publications
        .filter(pub => showAdminView || pub.homepage)
        .filter(pub => 
          selectedTags.some(selectedTag => 
            pub.tags && pub.tags.includes(selectedTag)
          )
        );

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
          <p className="text-gray-600">Chargement des communiqués...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Communiqués</h1>
              <p className="text-xl opacity-90">Communiqués de presse et positions du SRH</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAdminView(!showAdminView)}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium ${
                      showAdminView 
                        ? 'bg-white text-srh-blue hover:bg-gray-100' 
                        : 'bg-srh-blue-dark text-white hover:bg-opacity-80 border border-white'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    {showAdminView ? 'Vue public' : 'Vue admin'}
                  </button>
                  {!editing && (
                    <button
                      onClick={startAdd}
                      className="bg-white text-srh-blue hover:bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Nouveau communiqué
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  />
                </div>
                
                <div className="flex items-center space-x-6 pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSubscribersOnly}
                      onChange={(e) => setEditingSubscribersOnly(e.target.checked)}
                      className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Abonnés seulement</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingHomepage}
                      onChange={(e) => setEditingHomepage(e.target.checked)}
                      className="h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
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
                        } catch (error) {
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

        {/* All Tags List */}
        {!editing && publications.length > 0 && (() => {
          // Extract all unique tags from filtered publications and sort alphabetically
          const availableTags = Array.from(
            new Set(
              filteredPublications
                .flatMap(pub => pub.tags || [])
                .filter(tag => tag && tag.trim().length > 0)
            )
          ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          
          if (availableTags.length === 0) return null;
          
          return (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Tags {selectedTags.length > 0 && `(${selectedTags.length} sélectionné${selectedTags.length > 1 ? 's' : ''})`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagFilter(tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-srh-blue text-white border-srh-blue hover:bg-srh-blue-dark'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Effacer tous les filtres
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Publications List */}
        {!editing && (
          <>
            {isAdmin && showAdminView && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center mb-4">
                  <Megaphone className="h-8 w-8 text-red-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Gestion des communiqués</h2>
                </div>
                
                {filteredPublications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {publications.length === 0 
                        ? "Aucun communiqué disponible pour le moment." 
                        : "Aucun communiqué ne correspond aux filtres sélectionnés."
                      }
                    </p>
                    <button
                      onClick={startAdd}
                      className="mt-4 bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter le premier communiqué
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPublications.map((publication) => (
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

            {/* Public View - InfoCard Grid */}
            {(!isAdmin || !showAdminView) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPublications.length === 0 ? (
                  <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600">
                      {publications.length === 0 
                        ? "Aucun communiqué disponible pour le moment." 
                        : "Aucun communiqué ne correspond aux tags sélectionnés."
                      }
                    </p>
                    {isAdmin && (
                      <button
                        onClick={startAdd}
                        className="mt-4 bg-srh-blue hover:bg-srh-blue-dark text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter le premier communiqué
                      </button>
                    )}
                  </div>
                ) : (
                  filteredPublications.map((publication) => {
                    // Convert Delta content to plain text for excerpt
                    const plainTextContent = deltaToPlainText(publication.content);
                    
                    // Convert publication to NewsItem format for InfoCard
                    const newsItem = {
                      id: publication.id.toString(),
                      title: publication.title,
                      excerpt: plainTextContent.length > 200 
                        ? plainTextContent.substring(0, 200) + '...' 
                        : plainTextContent,
                      content: publication.content,
                      publishedAt: publication.pubdate,
                      slug: `communique-${publication.id}`,
                      category: 'Communiqué' as const,
                    };
                    
                    return (
                      <InfoCard 
                        key={publication.id} 
                        article={newsItem}
                        image={publication.picture}
                      />
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* Newsletter Subscription */}
        {!editing && (
          <section className="bg-blue-50 rounded-lg p-8 mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Restez informé</h2>
            <p className="text-gray-700 mb-6">
              Inscrivez-vous pour recevoir nos communiqués directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                S'inscrire
              </button>
            </div>
          </section>
        )}
        </div>
      </div>
    </>
  );
};

export default Communiques;