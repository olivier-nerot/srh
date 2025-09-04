import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import QuillEditor from 'quill-next-react';
// import { Delta } from 'quill-next';
import 'quill-next/dist/quill.snow.css';
import { Edit, Plus, Trash2, Save, X, ChevronDown, ChevronRight, Search } from 'lucide-react';

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

// Helper function to convert Delta JSON to plain text for search
const deltaToPlainText = (answer: string): string => {
  try {
    // Try to parse as Delta JSON
    const delta = JSON.parse(answer);
    if (delta.ops && Array.isArray(delta.ops)) {
      // Extract just the text content without formatting
      return delta.ops.map((op: { insert?: string }) => {
        if (typeof op.insert === 'string') {
          return op.insert.replace(/\n/g, ' ').trim();
        }
        return '';
      }).join('').trim();
    }
  } catch {
    // Parsing failed, treat as HTML and strip tags
    return answer.replace(/<[^>]*>/g, '').trim();
  }
  
  // Fallback: strip HTML tags and return plain text
  return answer.replace(/<[^>]*>/g, '').trim();
};

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
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
  const [searchText, setSearchText] = useState('');

  const isAdmin = user?.isadmin === true;

  // Load FAQs only for authenticated users

  useEffect(() => {
    if (isAuthenticated) {
      fetchFAQs();
    }
  }, [isAuthenticated]);

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

  // Filter FAQs based on selected tags and search text
  const filteredFAQs = faqs.filter(faq => {
    // Filter by selected tags (AND logic - FAQ must have ALL selected tags)
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(selectedTag => 
        faq.tags && faq.tags.includes(selectedTag)
      );
    
    // Filter by search text (question or answer)
    const matchesSearchText = searchText.trim() === '' || 
      faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
      deltaToPlainText(faq.answer).toLowerCase().includes(searchText.toLowerCase());
    
    return matchesTags && matchesSearchText;
  });



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

  // Show access restricted page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Blue curved header section */}
        <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Foire Aux Questions</h1>
              <p className="text-xl opacity-90">Accès réservé aux membres du SRH</p>
            </div>
          </div>
          {/* Curved bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50" 
               style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-srh-blue rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Accès Restreint</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Cette section est exclusivement réservée aux membres du Syndicat des Radiologues Hospitaliers.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vous n'êtes pas encore membre ?</strong>
              </p>
              <p className="text-sm text-gray-600">
                Rejoignez le SRH pour accéder à nos ressources exclusives, FAQ détaillées et bénéficier de notre accompagnement professionnel.
              </p>
            </div>

            <button
              onClick={() => navigate('/jadhere-au-srh')}
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Adhérer au SRH
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Déjà membre ? <button 
                onClick={() => navigate('/login')}
                className="text-srh-blue hover:text-srh-blue-dark underline font-medium"
              >
                Connectez-vous ici
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching FAQs for authenticated users
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

        {/* Filters: Search + Tags */}
        {!editing && faqs.length > 0 && (() => {
          // Extract all unique tags from all FAQs and sort alphabetically
          const availableTags = Array.from(
            new Set(
              faqs
                .flatMap(faq => faq.tags || [])
                .filter(tag => tag && tag.trim().length > 0)
            )
          ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          
          return (
            <div className="bg-white rounded-lg shadow-sm p-3 mb-8">
              {/* First line: Search input */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher dans les questions et réponses..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-srh-blue focus:border-transparent outline-none"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Second line: Tags and clear button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1 flex-1 min-h-[24px]">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagFilter(tag)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
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
                {(selectedTags.length > 0 || searchText.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTags([]);
                      setSearchText('');
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap ml-2"
                  >
                    Effacer
                  </button>
                )}
              </div>
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
                    : (selectedTags.length > 0 || searchText.trim())
                      ? "Aucune FAQ ne correspond aux critères de recherche."
                      : "Aucune FAQ disponible pour le moment."
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