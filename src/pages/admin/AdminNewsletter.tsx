import React, { useState, useEffect } from 'react';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';
import { Mail, Send, Eye, FileText, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface Publication {
  id: number;
  title: string;
  content: string;
  pubdate: string;
  type: string;
}

interface SendProgress {
  sent: number;
  total: number;
  isComplete: boolean;
  errors?: { email: string; error: string }[];
}

const AdminNewsletter: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [quillRef, setQuillRef] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [publications, setPublications] = useState<Publication[]>([]);
  const [selectedPublications, setSelectedPublications] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<SendProgress | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load recent publications on component mount
  useEffect(() => {
    loadRecentPublications();
  }, []);

  const loadRecentPublications = async () => {
    try {
      const response = await fetch('/api/newsletter');
      const data = await response.json();
      
      if (data.success) {
        setPublications(data.publications);
        // Select all publications by default
        const allPublicationIds = data.publications.map((pub: Publication) => pub.id);
        setSelectedPublications(allPublicationIds);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des publications' });
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des publications' });
    }
  };

  const handlePublicationToggle = (publicationId: number) => {
    setSelectedPublications(prev => 
      prev.includes(publicationId)
        ? prev.filter(id => id !== publicationId)
        : [...prev, publicationId]
    );
  };

  const hasValidContent = () => {
    if (!content) return false;
    try {
      const delta = JSON.parse(content);
      if (delta.ops) {
        const text = delta.ops.reduce((acc: string, op: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          return acc + (typeof op.insert === 'string' ? op.insert : '');
        }, '').trim();
        return text.length > 0;
      }
    } catch {
      return content.trim().length > 0;
    }
    return false;
  };

  const handlePreview = async () => {
    if (!title.trim() || !hasValidContent()) {
      setMessage({ type: 'error', text: 'Veuillez renseigner un titre et un contenu' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          title,
          content,
          selectedPublicationIds: selectedPublications
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreviewHtml(data.previewHtml);
        setShowPreview(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la génération de l\'aperçu' });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la génération de l\'aperçu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !hasValidContent()) {
      setMessage({ type: 'error', text: 'Veuillez renseigner un titre et un contenu' });
      return;
    }

    const confirmSend = window.confirm(
      `Êtes-vous sûr de vouloir envoyer cette newsletter ? Cette action est irréversible.`
    );

    if (!confirmSend) return;

    setIsSending(true);
    setSendProgress({ sent: 0, total: 0, isComplete: false });
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          title,
          content,
          selectedPublicationIds: selectedPublications
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSendProgress({
          sent: data.sent,
          total: data.total,
          isComplete: true,
          errors: data.errors
        });
        setMessage({ 
          type: 'success', 
          text: `Newsletter envoyée avec succès à ${data.sent}/${data.total} abonnés` 
        });
        
        // Reset form after successful send
        setTitle('');
        setContent('');
        setSelectedPublications([]);
        if (quillRef) {
          quillRef.setContents([{ insert: '\n' }], 'api');
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi de la newsletter' });
        setSendProgress(null);
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de la newsletter' });
      setSendProgress(null);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      publication: 'Publication',
      communique: 'Communiqué',
      jo: 'Journal Officiel',
      rapport: 'Rapport'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <Mail className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
                <p className="text-gray-600 mt-1">Création et envoi de la newsletter SRH</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-start ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </div>
          </div>
        )}

        {/* Send Progress */}
        {sendProgress && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-srh-blue" />
              Envoi en cours...
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-srh-blue h-3 rounded-full transition-all duration-300"
                style={{ width: `${sendProgress.total > 0 ? (sendProgress.sent / sendProgress.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {sendProgress.sent} / {sendProgress.total} emails envoyés
              {sendProgress.errors && sendProgress.errors.length > 0 && (
                <span className="text-red-600 ml-2">
                  ({sendProgress.errors.length} échecs)
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Newsletter Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-srh-blue" />
                  Créer une newsletter
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la newsletter *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Newsletter SRH - Janvier 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue focus:border-transparent"
                    disabled={isSending}
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu de la newsletter *
                  </label>
                  <div className="border border-gray-300 rounded-md" style={{ minHeight: '300px' }}>
                    <QuillEditor
                      onReady={(quill) => {
                        setQuillRef(quill);
                        
                        // Set up text-change event listener
                        quill.on('text-change', () => {
                          const delta = quill.getContents();
                          setContent(JSON.stringify(delta));
                        });
                      }}
                      config={{
                        theme: 'snow',
                        readOnly: isSending,
                        modules: {
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link'],
                            ['clean']
                          ],
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePreview}
                    disabled={isLoading || isSending || !title.trim() || !hasValidContent()}
                    className="flex items-center justify-center px-4 py-2 border border-srh-blue text-srh-blue hover:bg-srh-blue hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isLoading ? 'Génération...' : 'Aperçu'}
                  </button>
                  
                  <button
                    onClick={handleSend}
                    disabled={isSending || !title.trim() || !hasValidContent()}
                    className="flex items-center justify-center px-4 py-2 bg-srh-blue text-white hover:bg-srh-blue-dark rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Envoi en cours...' : 'Envoyer la newsletter'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Publications Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-srh-blue" />
                  Publications récentes
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sélectionnez les publications des 3 derniers mois à inclure
                </p>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {publications.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Aucune publication récente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {publications.map((pub) => (
                      <label key={pub.id} className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedPublications.includes(pub.id)}
                          onChange={() => handlePublicationToggle(pub.id)}
                          className="mt-1 h-4 w-4 text-srh-blue focus:ring-srh-blue border-gray-300 rounded"
                          disabled={isSending}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-srh-blue line-clamp-2">
                            {pub.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getTypeLabel(pub.type)} • {formatDate(pub.pubdate)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedPublications.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {selectedPublications.length} publication(s) sélectionnée(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Aperçu de la newsletter
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500 text-2xl leading-none"
              >
                <span className="sr-only">Fermer</span>
                ×
              </button>
            </div>
            <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{ minHeight: '800px' }}
                title="Aperçu de la newsletter"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSend();
                }}
                disabled={isSending}
                className="px-4 py-2 bg-srh-blue text-white hover:bg-srh-blue-dark rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2 inline" />
                Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;