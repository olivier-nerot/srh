import React, { useState, useEffect } from 'react';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';
import { Mail, Send, Eye, FileText, Calendar, Users, AlertCircle, CheckCircle, Clock, Loader, Trash2, Plus, History, Save, Edit, X } from 'lucide-react';

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

interface QueueStatus {
  id: number;
  title: string;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: number;
  updatedAt: number;
}

interface DebugMode {
  enabled: boolean;
  email: string | null;
  limit: number | null;
}

interface NewsletterHistory {
  id: number;
  title: string;
  content: string;
  selectedPublicationIds: number[] | null;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

interface Draft {
  id: number;
  title: string;
  content: string;
  selectedPublicationIds: number[] | null;
  updatedAt: number;
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
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [debugMode, setDebugMode] = useState<DebugMode | null>(null);
  const [history, setHistory] = useState<NewsletterHistory[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [viewingNewsletter, setViewingNewsletter] = useState<NewsletterHistory | null>(null);

  // Load recent publications and queue status on component mount
  useEffect(() => {
    loadNewsletterData();
    // Poll for queue status updates every 30 seconds
    const interval = setInterval(loadNewsletterData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNewsletterData = async () => {
    try {
      const response = await fetch('/api/newsletter-v2');
      const data = await response.json();

      if (data.success) {
        setPublications(data.publications);
        setQueueStatus(data.queueStatus);
        setDebugMode(data.debugMode || null);
        setHistory(data.history || []);
        setDrafts(data.drafts || []);

        // Select all publications by default if none selected
        if (selectedPublications.length === 0) {
          const allPublicationIds = data.publications.map((pub: Publication) => pub.id);
          setSelectedPublications(allPublicationIds);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des données' });
      }
    } catch (error) {
      console.error('Error loading newsletter data:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
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
      const response = await fetch('/api/newsletter-v2', {
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
      `Êtes-vous sûr de vouloir envoyer cette newsletter ?\n\nLes 100 premiers emails seront envoyés immédiatement.\nLes emails restants seront envoyés automatiquement chaque jour à 9h00 UTC.`
    );

    if (!confirmSend) return;

    setIsSending(true);
    setSendProgress({ sent: 0, total: 0, isComplete: false });
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'queue',
          title,
          content,
          selectedPublicationIds: selectedPublications
        })
      });

      const data = await response.json();

      if (data.success) {
        setSendProgress({
          sent: data.sentImmediately,
          total: data.totalRecipients,
          isComplete: data.remainingToSend === 0,
        });

        const messageText = data.remainingToSend > 0
          ? `Newsletter mise en file d'attente ! ${data.sentImmediately} emails envoyés immédiatement, ${data.remainingToSend} restants seront envoyés automatiquement (estimation : ${data.estimatedDays} jour${data.estimatedDays > 1 ? 's' : ''}).`
          : `Newsletter envoyée avec succès à ${data.totalRecipients} abonné${data.totalRecipients > 1 ? 's' : ''} !`;

        setMessage({
          type: 'success',
          text: messageText
        });

        // Reload queue status
        loadNewsletterData();

        // Reset form after successful send
        setTitle('');
        setContent('');
        setSelectedPublications([]);
        if (quillRef) {
          quillRef.setContents([{ insert: '\n' }], 'api');
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise en file d\'attente' });
        setSendProgress(null);
      }
    } catch (error) {
      console.error('Error queueing newsletter:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise en file d\'attente' });
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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    const statuses: { [key: string]: string } = {
      draft: 'Brouillon',
      pending: 'En attente',
      sending: 'En cours d\'envoi',
      completed: 'Envoyé',
      failed: 'Échec'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteNewsletter = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette newsletter ?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/newsletter-v2?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Newsletter supprimée avec succès' });
        loadNewsletterData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression' });
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Le titre et le contenu sont requis' });
      return;
    }

    setIsSavingDraft(true);
    try {
      const response = await fetch('/api/newsletter-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save-draft',
          title,
          content,
          selectedPublicationIds: selectedPublications,
          draftId: currentDraftId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setCurrentDraftId(data.draftId);
        loadNewsletterData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du brouillon' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleLoadDraft = (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setSelectedPublications(draft.selectedPublicationIds || []);
    setCurrentDraftId(draft.id);
    setShowForm(true);

    // Set content in Quill editor
    if (quillRef) {
      try {
        const delta = JSON.parse(draft.content);
        quillRef.setContents(delta);
      } catch (error) {
        console.error('Error loading draft content:', error);
      }
    }

    setMessage({ type: 'info', text: 'Brouillon chargé' });
  };

  const handleSendDraft = async (draftId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir envoyer ce brouillon ?')) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/newsletter-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-draft',
          draftId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setCurrentDraftId(null);
        setTitle('');
        setContent('');
        setSelectedPublications([]);
        if (quillRef) {
          quillRef.setText('');
        }
        loadNewsletterData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch (error) {
      console.error('Error sending draft:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du brouillon' });
    } finally {
      setIsSending(false);
    }
  };

  const handleNewNewsletter = () => {
    setTitle('');
    setContent('');
    setSelectedPublications([]);
    setCurrentDraftId(null);
    if (quillRef) {
      quillRef.setText('');
    }
    setShowForm(true);
  };

  const handleViewNewsletter = (newsletter: NewsletterHistory) => {
    setViewingNewsletter(newsletter);
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
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center px-4 py-2 bg-srh-blue text-white rounded-md hover:bg-srh-blue-dark transition-colors"
            >
              {showForm ? (
                <>
                  <History className="h-5 w-5 mr-2" />
                  Voir l'historique
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle newsletter
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Mode Banner */}
        {debugMode && debugMode.enabled && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-md p-4">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-yellow-900 mb-2 uppercase">
                  ⚠️ Mode Debug Activé ⚠️
                </h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p><strong>Aucun email ne sera envoyé aux membres réels.</strong></p>
                  <p>• Tous les emails seront redirigés vers : <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">{debugMode.email}</span></p>
                  <p>• Limite de batch : <span className="font-semibold">{debugMode.limit} emails maximum</span></p>
                  <p>• Les sujets des emails incluront le préfixe <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">[DEBUG]</span></p>
                </div>
                <div className="mt-3 pt-3 border-t border-yellow-300 text-xs text-yellow-700">
                  Pour désactiver : Mettre <span className="font-mono">NEWSLETTER_DEBUG_MODE=false</span> dans les variables d'environnement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Status Banner */}
        {queueStatus && queueStatus.status === 'sending' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <Loader className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0 animate-spin" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Newsletter en cours d'envoi
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>{queueStatus.title}</strong>
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${queueStatus.totalRecipients > 0 ? (queueStatus.sentCount / queueStatus.totalRecipients) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>
                    {queueStatus.sentCount} / {queueStatus.totalRecipients} emails envoyés
                    {queueStatus.failedCount > 0 && (
                      <span className="text-red-600 ml-2">
                        ({queueStatus.failedCount} échecs)
                      </span>
                    )}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Envoi automatique quotidien à 9h00 UTC
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md flex items-start ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : message.type === 'info'
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            ) : message.type === 'info' ? (
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className={
              message.type === 'success'
                ? 'text-green-800'
                : message.type === 'info'
                ? 'text-blue-800'
                : 'text-red-800'
            }>
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

        {/* Toggle between form and history */}
        {showForm ? (
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
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSending || !title.trim() || !hasValidContent()}
                    className="flex items-center justify-center px-4 py-2 border border-gray-500 text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingDraft ? 'Sauvegarde...' : currentDraftId ? 'Mettre à jour le brouillon' : 'Sauvegarder comme brouillon'}
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
        ) : (
          <div className="space-y-6">
            {/* Drafts Section */}
            {drafts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-srh-blue" />
                      Brouillons
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {drafts.length} brouillon(s) en attente
                    </p>
                  </div>
                  <button
                    onClick={handleNewNewsletter}
                    className="flex items-center px-4 py-2 bg-srh-blue text-white rounded-md hover:bg-srh-blue-dark transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {draft.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Modifié le {formatDateTime(draft.updatedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleLoadDraft(draft)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier ce brouillon"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSendDraft(draft.id)}
                            disabled={isSending}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                            title="Envoyer ce brouillon"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNewsletter(draft.id)}
                            disabled={deletingId === draft.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Supprimer ce brouillon"
                          >
                            {deletingId === draft.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter History */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-srh-blue" />
                  Historique des newsletters
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {history.length} newsletter(s) envoyée(s)
                </p>
              </div>

            <div className="divide-y divide-gray-200">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucune newsletter envoyée pour le moment
                </div>
              ) : (
                history.map((newsletter) => (
                  <div key={newsletter.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {newsletter.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                            {getStatusLabel(newsletter.status)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDateTime(newsletter.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {newsletter.sentCount} / {newsletter.totalRecipients} envoyés
                          </div>
                          {newsletter.failedCount > 0 && (
                            <span className="text-red-600">
                              {newsletter.failedCount} échecs
                            </span>
                          )}
                        </div>

                        {newsletter.status === 'completed' && newsletter.completedAt && (
                          <p className="text-xs text-gray-500">
                            Complété le {formatDateTime(newsletter.completedAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewNewsletter(newsletter)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Voir cette newsletter"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNewsletter(newsletter.id)}
                          disabled={deletingId === newsletter.id || newsletter.status === 'sending'}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer cette newsletter"
                        >
                          {deletingId === newsletter.id ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        )}
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

      {/* View Newsletter Modal */}
      {viewingNewsletter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewingNewsletter.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingNewsletter.status)}`}>
                    {getStatusLabel(viewingNewsletter.status)}
                  </span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDateTime(viewingNewsletter.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {viewingNewsletter.sentCount} / {viewingNewsletter.totalRecipients} envoyés
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingNewsletter(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-auto p-6" style={{ maxHeight: '70vh' }}>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    try {
                      const delta = JSON.parse(viewingNewsletter.content);
                      if (delta.ops && Array.isArray(delta.ops)) {
                        return delta.ops.map((op: any) => {
                          if (typeof op.insert === 'string') {
                            let text = op.insert;
                            if (op.attributes) {
                              const attrs = op.attributes;
                              if (attrs.bold) text = `<strong>${text}</strong>`;
                              if (attrs.italic) text = `<em>${text}</em>`;
                              if (attrs.underline) text = `<u>${text}</u>`;
                              if (attrs.link) text = `<a href="${attrs.link}" target="_blank" rel="noopener noreferrer" style="color: #1e40af;">${text}</a>`;
                              if (attrs.header) text = `<h${attrs.header} style="color: #1e40af; margin: 16px 0 8px 0;">${text}</h${attrs.header}>`;
                            }
                            return text.replace(/\n/g, '<br>');
                          }
                          return '';
                        }).join('');
                      }
                    } catch (error) {
                      return viewingNewsletter.content ? viewingNewsletter.content.replace(/\n/g, '<br>') : '';
                    }
                    return viewingNewsletter.content || '';
                  })()
                }}
              />

              {viewingNewsletter.selectedPublicationIds && viewingNewsletter.selectedPublicationIds.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Publications incluses
                  </h4>
                  <div className="text-sm text-gray-600">
                    {viewingNewsletter.selectedPublicationIds.length} publication(s) incluse(s)
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingNewsletter(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;