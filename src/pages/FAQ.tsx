import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import QuillEditor from 'quill-next-react';
// import { Delta } from 'quill-next';
import 'quill-next/dist/quill.snow.css';
import { Edit, Plus, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EditingFAQ {
  id?: number;
  question: string;
  answer: string;
  tags: string[];
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

// Helper component to display FAQ answers
const FAQAnswerDisplay: React.FC<{ answer: string }> = ({ answer }) => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(answer);
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
  return <div dangerouslySetInnerHTML={{ __html: answer }} />;
};

const FAQ: React.FC = () => {
  const { user } = useAuthStore();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingFAQ | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quillRef, setQuillRef] = useState<any>(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingTagsInput, setEditingTagsInput] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<number>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isAdmin = user?.isadmin === true;

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/content?contentType=faq');
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

    // Get the current content from the Quill editor as Delta JSON
    let answerContent = editing.answer;
    if (quillRef) {
      const delta = quillRef.getContents();
      answerContent = JSON.stringify(delta);
    }

    try {
      const url = '/api/content?contentType=faq';
      const method = editing.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editing,
          question: editingQuestion,
          answer: answerContent,
          tags: editingTags,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFAQs(); // Refresh the list
        setEditing(null);
        setShowAddForm(false);
        setQuillRef(null);
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
      const response = await fetch('/api/content?contentType=faq', {
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
    setHasEditorContent(false);
    setEditingQuestion(faq.question);
    setEditingTags(faq.tags || []);
    setEditingTagsInput((faq.tags || []).join(', '));
    setEditing({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags || [],
    });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setQuillRef(null);
    setHasEditorContent(false);
    setEditingQuestion('');
    setEditingTags([]);
    setEditingTagsInput('');
    setEditing({
      question: '',
      answer: '',
      tags: [],
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowAddForm(false);
    setEditingQuestion('');
    setEditingTags([]);
    setEditingTagsInput('');
    setQuillRef(null);
  };

  const toggleFAQ = (faqId: number) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFAQs(newExpanded);
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

  // Filter FAQs based on selected tags
  const filteredFAQs = selectedTags.length === 0 
    ? faqs 
    : faqs.filter(faq => 
        selectedTags.some(selectedTag => 
          faq.tags && faq.tags.includes(selectedTag)
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
          <p className="text-gray-600">Chargement des FAQ...</p>
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Foire Aux Questions</h1>
              <p className="text-xl opacity-90">Trouvez rapidement des réponses aux questions les plus fréquemment posées</p>
            </div>
            {isAdmin && !editing && (
              <button
                onClick={startAdd}
                className="bg-white text-srh-blue hover:bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouvelle question
              </button>
            )}
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">

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
                  value={editingQuestion}
                  onChange={(e) => setEditingQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  placeholder="Entrez votre question..."
                />
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
                  Réponse
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
                    
                    // Set initial content if editing existing FAQ
                    if (editing?.answer && editing.id) {
                      // Use setTimeout to ensure the editor is fully initialized
                      setTimeout(() => {
                        try {
                          // First try to parse as Delta JSON (for backward compatibility)
                          const savedDelta = JSON.parse(editing.answer);
                          
                          // Use the ops array directly and ensure it ends with newline
                          let ops = savedDelta.ops || [];
                          
                          // Ensure the last operation ends with a newline
                          if (ops.length > 0) {
                            const lastOp = ops[ops.length - 1];
                            if (!lastOp.insert || !lastOp.insert.endsWith('\n')) {
                              // If last op doesn't end with newline, add one
                              if (lastOp.insert) {
                                lastOp.insert += '\n';
                              } else {
                                ops.push({ insert: '\n' });
                              }
                            }
                          } else {
                            // Empty ops, add a newline
                            ops = [{ insert: '\n' }];
                          }
                          
                          quill.setContents(ops, 'api');
                          
                          // Force a re-render/refresh of the editor
                          quill.update();
                          
                          // Set focus to make sure it's visible
                          setTimeout(() => {
                            quill.focus();
                          }, 50);
                          
                          const text = quill.getText().trim();
                          setHasEditorContent(text.length > 0);
                        } catch (error) {
                          // If parsing fails, treat as HTML and set it in the editor
                          quill.root.innerHTML = editing.answer;
                          
                          // Force a re-render/refresh of the editor
                          quill.update();
                          
                          // Set focus to make sure it's visible
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
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!editingQuestion.trim() || !hasEditorContent}
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
        {!editing && faqs.length > 0 && (() => {
          // Extract all unique tags from filtered FAQs and sort alphabetically
          const availableTags = Array.from(
            new Set(
              filteredFAQs
                .flatMap(faq => faq.tags || [])
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

        {/* FAQ List - Hide when editing */}
        {!editing && (
          <div className="space-y-6">
            {filteredFAQs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">
                  {faqs.length === 0 
                    ? "Aucune FAQ disponible pour le moment." 
                    : "Aucune FAQ ne correspond aux tags sélectionnés."
                  }
                </p>
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
              filteredFAQs.map((faq) => {
                const isExpanded = expandedFAQs.has(faq.id);
                return (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Question Header - Clickable */}
                    <div 
                      className="bg-gray-100 text-gray-800 rounded-t-lg cursor-pointer transition-colors hover:bg-gray-200"
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 transition-transform" />
                              ) : (
                                <ChevronRight className="h-5 w-5 transition-transform" />
                              )}
                            </div>
                            <div className="flex-1">
                              <TagChips tags={faq.tags || []} />
                              <h3 className="text-lg font-semibold">
                                {faq.question}
                              </h3>
                            </div>
                          </div>
                          
                          {/* Admin Controls */}
                          {isAdmin && !editing && (
                            <div className="flex gap-2 ml-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent accordion toggle
                                  startEdit(faq);
                                }}
                                className="text-gray-600 hover:text-gray-800 p-1 transition-colors"
                                title="Éditer"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent accordion toggle
                                  handleDelete(faq.id);
                                }}
                                className="text-gray-600 hover:text-red-600 p-1 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Answer Content - Collapsible */}
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                      }`}
                    >
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <FAQAnswerDisplay answer={faq.answer} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default FAQ;